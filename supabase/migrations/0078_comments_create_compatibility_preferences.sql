-- Integration step (I1, safe layer): comment edit tracking, up to 8 create
-- options, comparison visibility (public/followers), drafts, per-category
-- compatibility breakdown, and a per-preference-label signal so "why does
-- TOT think you prefer Toyota" has real evidence behind it.
--
-- The branch's original @mention notification trigger is deliberately NOT
-- reintroduced here — main's handle_comment_notify() (0039) already scans
-- comment bodies for @mentions and inserts a 'mention' notification row,
-- functionally equivalent to what this branch built independently. Adding
-- a second mention trigger would double-notify every mention.

-- ============================================================
-- comments: edit tracking
-- ============================================================
alter table public.comments add column edited_at timestamptz;

-- ============================================================
-- comparisons: up to 8 options + follower-only visibility
-- ============================================================
alter table public.comparison_options drop constraint comparison_options_side_check;
alter table public.comparison_options add constraint comparison_options_side_check
  check (side in ('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'));

alter table public.comparisons add column visibility text not null default 'public'
  check (visibility in ('public', 'followers'));

create policy "followers-only comparisons are restricted"
  on public.comparisons as restrictive for select
  using (
    visibility = 'public'
    or creator_id = auth.uid()
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows f
        where f.follower_id = auth.uid() and f.followee_id = comparisons.creator_id
      )
    )
  );

-- ============================================================
-- comparison_drafts
-- ============================================================
create table public.comparison_drafts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  prompt text,
  visibility text not null default 'public' check (visibility in ('public', 'followers')),
  options jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.comparison_drafts enable row level security;

create policy "users can manage own drafts"
  on public.comparison_drafts for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create index idx_comparison_drafts_creator on public.comparison_drafts (creator_id, updated_at desc);

-- ============================================================
-- preference_signals: per-option-label win rate, the real evidence
-- behind "why does TOT think you prefer Toyota" (31 of 39 automotive
-- comparisons) rather than only the category-level share preference_dna
-- already tracks.
-- ============================================================
create table public.preference_signals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  label_key text not null,
  label text not null,
  wins int not null default 0,
  opportunities int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, label_key)
);

alter table public.preference_signals enable row level security;

create policy "users can view own preference signals"
  on public.preference_signals for select
  using (auth.uid() = user_id);

create index idx_preference_signals_user on public.preference_signals (user_id, opportunities desc);

create function public.handle_vote_preference_signals()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_category_id uuid;
  opt record;
begin
  select category_id into v_category_id from public.comparisons where id = new.comparison_id;

  for opt in
    select id, label from public.comparison_options where comparison_id = new.comparison_id
  loop
    insert into public.preference_signals (user_id, category_id, label_key, label, wins, opportunities, updated_at)
    values (
      new.user_id,
      v_category_id,
      lower(btrim(opt.label)),
      opt.label,
      case when opt.id = new.option_id then 1 else 0 end,
      1,
      now()
    )
    on conflict (user_id, label_key) do update
    set wins = public.preference_signals.wins + (case when opt.id = new.option_id then 1 else 0 end),
        opportunities = public.preference_signals.opportunities + 1,
        category_id = coalesce(public.preference_signals.category_id, excluded.category_id),
        label = excluded.label,
        updated_at = now();
  end loop;
  return new;
end;
$$;

create trigger on_vote_preference_signals
  after insert on public.votes
  for each row execute function public.handle_vote_preference_signals();

revoke execute on function public.handle_vote_preference_signals() from anon, authenticated;

-- ============================================================
-- compatibility: per-category breakdown alongside the existing overall
-- agreement percentage. compare_users() is main's original (0001) base
-- function, untouched by any of main's own migrations — safe to extend.
-- ============================================================
create or replace function public.compare_users(user_a uuid, user_b uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_total int;
  v_agree int;
  v_result jsonb;
begin
  select count(*) into v_total
  from public.votes va
  join public.votes vb on va.comparison_id = vb.comparison_id
  where va.user_id = user_a and vb.user_id = user_b;

  select count(*) into v_agree
  from public.votes va
  join public.votes vb on va.comparison_id = vb.comparison_id
  where va.user_id = user_a and vb.user_id = user_b and va.option_id = vb.option_id;

  select jsonb_build_object(
    'shared_comparisons', v_total,
    'agreed', v_agree,
    'compatibility_pct', case when v_total > 0 then round((v_agree::numeric / v_total) * 100, 1) else null end,
    'agreements', coalesce((
      select jsonb_agg(jsonb_build_object('comparison_id', va.comparison_id, 'option_label', co.label))
      from public.votes va
      join public.votes vb on va.comparison_id = vb.comparison_id and va.option_id = vb.option_id
      join public.comparison_options co on co.id = va.option_id
      where va.user_id = user_a and vb.user_id = user_b
      limit 10
    ), '[]'::jsonb),
    'differences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'comparison_id', va.comparison_id,
        'user_a_label', coa.label,
        'user_b_label', cob.label
      ))
      from public.votes va
      join public.votes vb on va.comparison_id = vb.comparison_id and va.option_id <> vb.option_id
      join public.comparison_options coa on coa.id = va.option_id
      join public.comparison_options cob on cob.id = vb.option_id
      where va.user_id = user_a and vb.user_id = user_b
      limit 10
    ), '[]'::jsonb),
    'by_category', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category_slug', cat.slug,
        'category_label', cat.label,
        'category_emoji', cat.emoji,
        'shared', cat_counts.shared,
        'agreed', cat_counts.agreed,
        'pct', round((cat_counts.agreed::numeric / cat_counts.shared) * 100, 1)
      ) order by cat_counts.shared desc)
      from (
        select
          c.category_id,
          count(*) as shared,
          count(*) filter (where va.option_id = vb.option_id) as agreed
        from public.votes va
        join public.votes vb on va.comparison_id = vb.comparison_id
        join public.comparisons c on c.id = va.comparison_id
        where va.user_id = user_a and vb.user_id = user_b and c.category_id is not null
        group by c.category_id
        having count(*) >= 2
      ) cat_counts
      join public.categories cat on cat.id = cat_counts.category_id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;
