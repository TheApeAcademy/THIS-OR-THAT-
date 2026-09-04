-- Phase 8 — Engagement core: bookmarks/collections, recently viewed,
-- search history, hashtags, opinion-changed tracking, content-preference
-- dials, and the data behind the onboarding warmup's "N preferences
-- discovered" stat.

-- ============================================================
-- bookmark collections — saved_comparisons already exists (0013); this
-- adds user-named folders on top of it, matching the existing table's
-- shape rather than replacing it.
-- ============================================================
create table public.bookmark_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.bookmark_collections enable row level security;

create policy "users can view own collections"
  on public.bookmark_collections for select
  using (auth.uid() = user_id);

create policy "users can create own collections"
  on public.bookmark_collections for insert
  with check (auth.uid() = user_id);

create policy "users can rename own collections"
  on public.bookmark_collections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own collections"
  on public.bookmark_collections for delete
  using (auth.uid() = user_id);

create index idx_bookmark_collections_user on public.bookmark_collections (user_id);

alter table public.saved_comparisons
  add column collection_id uuid references public.bookmark_collections(id) on delete set null;

-- saved_comparisons had select/insert/delete policies (0013) but no update
-- policy — needed now to move a saved item between collections.
create policy "users can move own saved item between collections"
  on public.saved_comparisons for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- recently viewed — capped at the 100 most recent per user via a
-- security-definer RPC (upsert + trim) so the client never has to manage
-- the cap itself.
-- ============================================================
create table public.recently_viewed (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, comparison_id)
);

alter table public.recently_viewed enable row level security;

create policy "users can view own recently viewed"
  on public.recently_viewed for select
  using (auth.uid() = user_id);

create index idx_recently_viewed_user on public.recently_viewed (user_id, viewed_at desc);

create function public.record_recently_viewed(p_comparison_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  insert into public.recently_viewed (user_id, comparison_id, viewed_at)
  values (v_user_id, p_comparison_id, now())
  on conflict (user_id, comparison_id) do update set viewed_at = now();

  delete from public.recently_viewed
  where user_id = v_user_id
    and comparison_id not in (
      select comparison_id from public.recently_viewed
      where user_id = v_user_id
      order by viewed_at desc
      limit 100
    );
end;
$$;

-- ============================================================
-- search history
-- ============================================================
create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

alter table public.search_history enable row level security;

create policy "users can view own search history"
  on public.search_history for select
  using (auth.uid() = user_id);

create policy "users can log own search"
  on public.search_history for insert
  with check (auth.uid() = user_id);

create policy "users can clear own search history"
  on public.search_history for delete
  using (auth.uid() = user_id);

create index idx_search_history_user on public.search_history (user_id, created_at desc);

-- ============================================================
-- hashtags — free-text, user-generated, distinct from the curated
-- `topics` taxonomy (0034). Parsed out of a comparison's prompt at create
-- time by the app, capped at 5 per comparison there.
-- ============================================================
create table public.hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text unique not null,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.hashtags enable row level security;

create policy "hashtags are publicly readable"
  on public.hashtags for select
  using (true);

create policy "authenticated users can create a hashtag"
  on public.hashtags for insert
  to authenticated
  with check (true);

create table public.comparison_hashtags (
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  hashtag_id uuid not null references public.hashtags(id) on delete cascade,
  primary key (comparison_id, hashtag_id)
);

alter table public.comparison_hashtags enable row level security;

create policy "comparison hashtags are publicly readable"
  on public.comparison_hashtags for select
  using (true);

create policy "creators can tag their own comparison with hashtags"
  on public.comparison_hashtags for insert
  with check (
    exists (
      select 1 from public.comparisons c
      where c.id = comparison_id and c.creator_id = auth.uid()
    )
  );

create index idx_comparison_hashtags_hashtag on public.comparison_hashtags (hashtag_id);

create function public.handle_hashtag_use_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.hashtags set use_count = use_count + 1 where id = new.hashtag_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.hashtags set use_count = greatest(use_count - 1, 0) where id = old.hashtag_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_comparison_hashtag_change
  after insert or delete on public.comparison_hashtags
  for each row execute function public.handle_hashtag_use_count();

revoke execute on function public.handle_hashtag_use_count() from anon, authenticated;

-- ============================================================
-- "opinion changed" tracking. voteAction still does a plain client-side
-- insert first (so the existing rate-limit and block restrictive
-- policies on `votes` keep applying to genuinely new votes). Only when
-- that insert collides with the existing (user_id, comparison_id) unique
-- constraint does the app fall back to this RPC, which is the one place
-- allowed to move an existing vote to a different option — there is
-- still no general UPDATE policy on `votes` itself.
-- ============================================================
create table public.vote_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  from_option_id uuid not null references public.comparison_options(id) on delete cascade,
  to_option_id uuid not null references public.comparison_options(id) on delete cascade,
  reason text,
  changed_at timestamptz not null default now()
);

alter table public.vote_changes enable row level security;

create policy "users can view own vote changes"
  on public.vote_changes for select
  using (auth.uid() = user_id);

create index idx_vote_changes_comparison on public.vote_changes (comparison_id);
create index idx_vote_changes_user on public.vote_changes (user_id, changed_at desc);

create function public.change_vote(p_comparison_id uuid, p_option_id uuid, p_reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_option_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.comparison_options
    where id = p_option_id and comparison_id = p_comparison_id
  ) then
    raise exception 'Option does not belong to this comparison';
  end if;

  if exists (
    select 1 from public.comparisons c
    where c.id = p_comparison_id
      and c.creator_id is not null
      and public.is_blocked(v_user_id, c.creator_id)
  ) then
    raise exception 'Not allowed';
  end if;

  select option_id into v_existing_option_id
  from public.votes
  where user_id = v_user_id and comparison_id = p_comparison_id;

  -- No existing vote (a real race with the caller's own insert attempt) or
  -- re-picking the same option — nothing to change.
  if v_existing_option_id is null or v_existing_option_id = p_option_id then
    return;
  end if;

  if (
    select count(*) from public.vote_changes
    where user_id = v_user_id and changed_at > now() - interval '1 hour'
  ) >= 60 then
    raise exception 'Too many vote changes — try again later';
  end if;

  update public.votes
  set option_id = p_option_id
  where user_id = v_user_id and comparison_id = p_comparison_id;

  update public.comparison_options set vote_count = greatest(vote_count - 1, 0) where id = v_existing_option_id;
  update public.comparison_options set vote_count = vote_count + 1 where id = p_option_id;

  -- preference_signals opportunities were already counted once, at the
  -- original vote — only the win moves from the old option's label to the
  -- new one. Category-level preference_dna is unaffected since the vote
  -- stays within the same comparison/category.
  update public.preference_signals ps
  set wins = greatest(ps.wins - 1, 0), updated_at = now()
  from public.comparison_options co
  where co.id = v_existing_option_id
    and ps.user_id = v_user_id
    and ps.label_key = lower(btrim(co.label));

  update public.preference_signals ps
  set wins = ps.wins + 1, updated_at = now()
  from public.comparison_options co
  where co.id = p_option_id
    and ps.user_id = v_user_id
    and ps.label_key = lower(btrim(co.label));

  insert into public.vote_changes (user_id, comparison_id, from_option_id, to_option_id, reason)
  values (v_user_id, p_comparison_id, v_existing_option_id, p_option_id, nullif(btrim(p_reason), ''));
end;
$$;

-- Attaching an optional "what changed your mind?" reason after the fact
-- (the UI shows the prompt only once the change has already landed).
create function public.set_last_vote_change_reason(p_comparison_id uuid, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  update public.vote_changes
  set reason = nullif(btrim(p_reason), '')
  where id = (
    select id from public.vote_changes
    where user_id = v_user_id and comparison_id = p_comparison_id
    order by changed_at desc
    limit 1
  );
end;
$$;

-- Public "N people changed their vote" count — votes/vote_changes have no
-- cross-user select policy, so this mirrors get_global_pulse's
-- security-definer aggregation pattern (0039) rather than exposing rows.
create function public.get_vote_change_count(p_comparison_id uuid)
returns int
language sql
stable
security definer set search_path = public
as $$
  select count(*)::int from public.vote_changes where comparison_id = p_comparison_id;
$$;

-- ============================================================
-- content-preference dials ("show me more/less" per category), folded
-- into get_feed_order's existing category-weight CTE as a multiplier on
-- top of the implicit preference_dna-derived weight.
-- ============================================================
create table public.category_feed_prefs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  weight smallint not null default 0 check (weight in (-1, 0, 1)),
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table public.category_feed_prefs enable row level security;

create policy "users can view own category feed prefs"
  on public.category_feed_prefs for select
  using (auth.uid() = user_id);

create policy "users can set own category feed prefs"
  on public.category_feed_prefs for insert
  with check (auth.uid() = user_id);

create policy "users can update own category feed prefs"
  on public.category_feed_prefs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can clear own category feed prefs"
  on public.category_feed_prefs for delete
  using (auth.uid() = user_id);

create or replace function public.get_feed_order(p_user_id uuid default null, p_limit int default 30)
returns table(comparison_id uuid)
language sql
stable
as $$
  with weights as (
    select
      cat.id as category_id,
      greatest(
        coalesce((pd.breakdown -> cat.slug ->> 'pct')::numeric, 0),
        8
      ) * (1 + coalesce(cfp.weight, 0) * 0.5) as weight
    from public.categories cat
    left join public.preference_dna pd on pd.user_id = p_user_id
    left join public.category_feed_prefs cfp on cfp.user_id = p_user_id and cfp.category_id = cat.id
  ),
  candidates as (
    select c.id, c.category_id, c.creator_id, c.vote_count, c.comment_count, c.created_at
    from public.comparisons c
    where c.status = 'active'
      and (p_user_id is null or not exists (
        select 1 from public.votes v where v.user_id = p_user_id and v.comparison_id = c.id
      ))
      and (p_user_id is null or not exists (
        select 1 from public.feed_dismissals d where d.user_id = p_user_id and d.comparison_id = c.id
      ))
      and (p_user_id is null or c.creator_id is null or not public.is_blocked(p_user_id, c.creator_id))
      and (p_user_id is null or c.creator_id is null or not exists (
        select 1 from public.mutes m where m.muter_id = p_user_id and m.muted_id = c.creator_id
      ))
  )
  select id from (
    select
      cand.id,
      row_number() over (
        partition by cand.category_id
        order by (
          exp(-greatest(extract(epoch from (now() - cand.created_at)) / 86400.0 - 1, 0) / 14.0)
          + ln(1 + cand.vote_count + cand.comment_count * 3) / (1 + extract(epoch from (now() - cand.created_at)) / 86400.0)
          + case when flw.followee_id is not null then 1.2 else 0 end
          + random() * 0.5
        ) desc
      ) / (w.weight * (0.7 + random() * 0.6)) as rank_key,
      random() as tiebreak
    from candidates cand
    join weights w on w.category_id = cand.category_id
    left join public.follows flw on flw.follower_id = p_user_id and flw.followee_id = cand.creator_id
  ) ranked
  order by rank_key, tiebreak
  limit p_limit;
$$;

-- ============================================================
-- onboarding warmup stat — "N preferences discovered", read off
-- preference_signals (0036) rather than a new counter.
-- ============================================================
-- Deliberately NOT security definer: preference_signals and votes are both
-- own-rows-only under RLS, and this only ever needs to answer for the
-- caller's own id, so running as the caller (not bypassing RLS) means a
-- mismatched p_user_id just returns zero counts instead of leaking another
-- user's numbers.
create function public.get_onboarding_stats(p_user_id uuid)
returns table(preferences_discovered int, votes_cast int)
language sql
stable
as $$
  select
    (select count(*)::int from public.preference_signals where user_id = p_user_id),
    (select count(*)::int from public.votes where user_id = p_user_id);
$$;
