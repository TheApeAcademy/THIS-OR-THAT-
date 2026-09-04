-- Phase 14 — Custom feeds & richer post types.

-- ============================================================
-- custom feeds — user-bundled topics (Phase 2's `topics`, not Phase 8's
-- bookmark collections, which bundle saved comparisons instead).
-- ============================================================
create table public.custom_feeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.custom_feeds enable row level security;

create policy "users can view own custom feeds"
  on public.custom_feeds for select
  using (auth.uid() = user_id);

create policy "users can create own custom feeds"
  on public.custom_feeds for insert
  with check (auth.uid() = user_id);

create policy "users can delete own custom feeds"
  on public.custom_feeds for delete
  using (auth.uid() = user_id);

create index idx_custom_feeds_user on public.custom_feeds (user_id);

create table public.custom_feed_topics (
  custom_feed_id uuid not null references public.custom_feeds(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (custom_feed_id, topic_id)
);

alter table public.custom_feed_topics enable row level security;

create policy "users can view own custom feed topics"
  on public.custom_feed_topics for select
  using (exists (select 1 from public.custom_feeds f where f.id = custom_feed_id and f.user_id = auth.uid()));

create policy "users can add topics to own custom feed"
  on public.custom_feed_topics for insert
  with check (exists (select 1 from public.custom_feeds f where f.id = custom_feed_id and f.user_id = auth.uid()));

create policy "users can remove topics from own custom feed"
  on public.custom_feed_topics for delete
  using (exists (select 1 from public.custom_feeds f where f.id = custom_feed_id and f.user_id = auth.uid()));

-- Comparisons tagged with any topic in a custom feed, newest first —
-- mirrors /topic/[slug]'s own query, just unioned across the bundle.
create function public.get_custom_feed_comparisons(p_custom_feed_id uuid, p_limit int default 30)
returns table(comparison_id uuid)
language sql
stable
security definer set search_path = public
as $$
  select distinct ct.comparison_id
  from public.comparison_topics ct
  join public.comparisons c on c.id = ct.comparison_id
  where c.status = 'active'
    and ct.topic_id in (
      select topic_id from public.custom_feed_topics
      where custom_feed_id = p_custom_feed_id
        and exists (
          select 1 from public.custom_feeds f
          where f.id = p_custom_feed_id and f.user_id = auth.uid()
        )
    )
  order by ct.comparison_id desc
  limit p_limit;
$$;

-- ============================================================
-- richer post types. this_or_that stays the default and only the
-- 2-8-option existing mechanic gets reused for multi_choice and
-- hot_take — hot_take is a statement with exactly two fixed options
-- ("Agree"/"Disagree"), not a new 1-option schema, since MIN_OPTIONS=2
-- is load-bearing throughout the existing comparison code (card data
-- shaping, feed dedup, etc.) and forking that for one post type isn't
-- worth the duplication.
-- ============================================================
alter table public.comparisons
  add column post_type text not null default 'this_or_that'
    check (post_type in ('this_or_that', 'multi_choice', 'ranked_choice', 'hot_take'));

-- Ranked-choice ballots — one row per (voter, option, rank). Vote counts
-- are never surfaced per-voter; get_ranked_ballots below pseudonymizes
-- the voter with a dense_rank so an instant-runoff count (computed in
-- the app layer, lib/instantRunoff.ts — genuinely complex round-by-round
-- elimination logic is easier to write and verify correctly in
-- TypeScript than to hand-roll in plpgsql without a live database to
-- test against) never needs real user identity.
create table public.vote_rankings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  option_id uuid not null references public.comparison_options(id) on delete cascade,
  rank int not null,
  created_at timestamptz not null default now(),
  primary key (user_id, comparison_id, option_id),
  unique (user_id, comparison_id, rank)
);

alter table public.vote_rankings enable row level security;

create policy "users can view own rankings"
  on public.vote_rankings for select
  using (auth.uid() = user_id);

create index idx_vote_rankings_comparison on public.vote_rankings (comparison_id);

create function public.submit_ranked_vote(p_comparison_id uuid, p_ranked_option_ids uuid[])
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_option_id uuid;
  v_rank int := 1;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (
    select 1 from public.comparisons c
    where c.id = p_comparison_id
      and c.creator_id is not null
      and public.is_blocked(v_user_id, c.creator_id)
  ) then
    raise exception 'Not allowed';
  end if;

  if array_length(p_ranked_option_ids, 1) is null or array_length(p_ranked_option_ids, 1) < 2 then
    raise exception 'Rank at least 2 options';
  end if;

  if exists (
    select 1 from unnest(p_ranked_option_ids) oid
    where not exists (
      select 1 from public.comparison_options co
      where co.id = oid and co.comparison_id = p_comparison_id
    )
  ) then
    raise exception 'One of the ranked options does not belong to this comparison';
  end if;

  delete from public.vote_rankings where user_id = v_user_id and comparison_id = p_comparison_id;

  foreach v_option_id in array p_ranked_option_ids loop
    insert into public.vote_rankings (user_id, comparison_id, option_id, rank)
    values (v_user_id, p_comparison_id, v_option_id, v_rank);
    v_rank := v_rank + 1;
  end loop;

  -- A ranked-choice ballot still counts toward the visible per-option
  -- tally the same way a normal vote does — the first choice is the
  -- headline number shown everywhere else in the app.
  if not exists (select 1 from public.votes where user_id = v_user_id and comparison_id = p_comparison_id) then
    insert into public.votes (user_id, comparison_id, option_id)
    values (v_user_id, p_comparison_id, p_ranked_option_ids[1]);
  end if;
end;
$$;

create function public.get_ranked_ballots(p_comparison_id uuid)
returns table(voter_seq int, option_id uuid, rank int)
language sql
stable
security definer set search_path = public
as $$
  select dense_rank() over (order by vr.user_id)::int, vr.option_id, vr.rank
  from public.vote_rankings vr
  where vr.comparison_id = p_comparison_id;
$$;
