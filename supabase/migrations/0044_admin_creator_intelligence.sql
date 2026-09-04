-- Phase 12 — Admin & creator intelligence: an audit log for existing
-- admin actions, admin dashboard metrics, per-comparison creator
-- insights, and recency-weighted Preference DNA.

-- ============================================================
-- audit log — one row per privileged action, written alongside the
-- mutation itself in lib/actions/admin.ts (no new subsystem, just an
-- insert next to each existing update).
-- ============================================================
create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null,
  target_type text not null,
  target_id text not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_actions enable row level security;

create policy "admins can view audit log"
  on public.admin_actions for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins can write audit log"
  on public.admin_actions for insert
  with check (
    admin_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create index idx_admin_actions_created on public.admin_actions (created_at desc);

-- ============================================================
-- admin dashboard metrics — DAU/WAU/MAU come from user_sessions (0041's
-- login history), the only real per-day activity signal this repo has;
-- everything else is derivable straight from existing created_at columns.
-- ============================================================
-- Both stats functions are admin-only. Unlike most of this repo's admin
-- actions (gated in the app layer via lib/actions/admin.ts's
-- requireAdmin), these are read via direct RPC calls from a server
-- component, so the check has to live in the function itself — otherwise
-- any authenticated user could call the RPC directly and read the whole
-- platform's metrics.
create function public.get_admin_daily_stats(p_days int default 14)
returns table(
  day date,
  new_signups int,
  votes int,
  comments int,
  comparisons_created int,
  active_users int
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'Not authorized';
  end if;

  return query
  select
    d.day,
    coalesce((select count(*) from public.profiles p where p.created_at::date = d.day), 0)::int,
    coalesce((select count(*) from public.votes v where v.created_at::date = d.day), 0)::int,
    coalesce((select count(*) from public.comments c where c.created_at::date = d.day), 0)::int,
    coalesce((select count(*) from public.comparisons cmp where cmp.created_at::date = d.day), 0)::int,
    coalesce((select count(distinct s.user_id) from public.user_sessions s where s.created_at::date = d.day), 0)::int
  from generate_series(
    current_date - (greatest(p_days, 1) - 1),
    current_date,
    interval '1 day'
  ) as d(day)
  order by d.day;
end;
$$;

create function public.get_admin_summary_stats()
returns table(
  total_users int,
  total_comparisons int,
  total_votes int,
  dau int,
  wau int,
  mau int
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
    raise exception 'Not authorized';
  end if;

  return query
  select
    (select count(*) from public.profiles)::int,
    (select count(*) from public.comparisons where status = 'active')::int,
    (select count(*) from public.votes)::int,
    (select count(distinct user_id) from public.user_sessions where created_at > now() - interval '1 day')::int,
    (select count(distinct user_id) from public.user_sessions where created_at > now() - interval '7 days')::int,
    (select count(distinct user_id) from public.user_sessions where created_at > now() - interval '30 days')::int;
end;
$$;

-- ============================================================
-- creator analytics — a view counter matching card_views' privacy stance
-- exactly (0039): an aggregate int on the row, no per-visitor record.
-- ============================================================
alter table public.comparisons add column view_count int not null default 0;

create function public.increment_comparison_view(p_comparison_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.comparisons set view_count = view_count + 1 where id = p_comparison_id;
end;
$$;

grant execute on function public.increment_comparison_view(uuid) to authenticated, anon;

-- Vote-distribution-over-time for the comparison's own creator. votes has
-- no cross-user select policy, so this is security definer — but it only
-- ever returns rows when the caller is that comparison's creator, never
-- individual voter identity either way (day + count only).
create function public.get_comparison_insights(p_comparison_id uuid)
returns table(day date, votes int)
language sql
stable
security definer set search_path = public
as $$
  select v.created_at::date as day, count(*)::int as votes
  from public.votes v
  join public.comparisons c on c.id = v.comparison_id
  where v.comparison_id = p_comparison_id
    and c.creator_id = auth.uid()
  group by v.created_at::date
  order by day;
$$;

-- ============================================================
-- preference decay: category *percentages* (what drives ranking,
-- confidence labels and get_feed_order's weighting) are now recency-
-- weighted with a ~180-day half-life. The raw `votes` count stored
-- alongside stays a true integer count — it's what the public card and
-- DnaBreakdown display ("31 votes"), and weighting that would make a
-- real number lie.
-- ============================================================
create or replace function public.handle_new_vote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_category_id uuid;
  v_category_slug text;
  v_cat_votes int;
  v_cat_weight numeric;
  v_total_weight numeric;
  v_cat_pct numeric;
begin
  update public.comparison_options set vote_count = vote_count + 1 where id = new.option_id;
  update public.comparisons set vote_count = vote_count + 1 where id = new.comparison_id;
  update public.profiles set reputation = reputation + 1 where id = new.user_id;

  select category_id into v_category_id from public.comparisons where id = new.comparison_id;

  if v_category_id is not null then
    select slug into v_category_slug from public.categories where id = v_category_id;

    select count(*) into v_cat_votes
    from public.votes v
    join public.comparisons c on c.id = v.comparison_id
    where v.user_id = new.user_id and c.category_id = v_category_id;

    select coalesce(sum(power(0.5, extract(epoch from (now() - v.created_at)) / 86400.0 / 180.0)), 0)
      into v_total_weight
    from public.votes v
    where v.user_id = new.user_id;

    select coalesce(sum(power(0.5, extract(epoch from (now() - v.created_at)) / 86400.0 / 180.0)), 0)
      into v_cat_weight
    from public.votes v
    join public.comparisons c on c.id = v.comparison_id
    where v.user_id = new.user_id and c.category_id = v_category_id;

    v_cat_pct := case when v_total_weight > 0
      then round((v_cat_weight / v_total_weight) * 100, 1)
      else 0
    end;

    insert into public.preference_dna (user_id, breakdown, updated_at)
    values (
      new.user_id,
      jsonb_build_object(v_category_slug, jsonb_build_object('votes', v_cat_votes, 'pct', v_cat_pct)),
      now()
    )
    on conflict (user_id) do update
    set breakdown = jsonb_set(
          coalesce(public.preference_dna.breakdown, '{}'::jsonb),
          array[v_category_slug],
          jsonb_build_object('votes', v_cat_votes, 'pct', v_cat_pct),
          true
        ),
        updated_at = now();
  end if;

  if (select count(*) from public.votes where user_id = new.user_id) = 1 then
    insert into public.achievements (user_id, type) values (new.user_id, 'first_vote')
    on conflict do nothing;
  end if;

  return new;
end;
$$;
