-- Integration step (I1, safe layer): bookmark collections, recently
-- viewed, search history, hashtags, and the onboarding warmup stat.
--
-- Three pieces from the original engagement-core migration are
-- deliberately NOT included here, each deferred to its own integration
-- step:
--   - change_vote() / set_last_vote_change_reason() / get_vote_change_count()
--     — change_vote() adjusts comparison_options.vote_count directly on a
--     votes UPDATE, which double-counts against main's own
--     handle_vote_switch() trigger doing the same adjustment on the same
--     UPDATE. Needs the I2 vote-switch reconciliation, not a plain layer.
--     The vote_changes TABLE itself is still created here (pure schema,
--     no logic collision) so I2 only has to add the functions.
--   - get_feed_order rewrite — folded into the single hand-merged
--     get_feed_order migration (I3) alongside every other branch change
--     and main's own independent expiry filter.
--   - category_feed_prefs is created here as a table (no collision), but
--     its actual use as a weight multiplier inside get_feed_order is part
--     of that same I3 merge.

-- ============================================================
-- bookmark collections — saved_comparisons already exists (shared 0013);
-- this adds user-named folders on top of it.
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

-- saved_comparisons had select/insert/delete policies (shared 0013) but no
-- update policy — needed now to move a saved item between collections.
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
-- `topics` taxonomy. Parsed out of a comparison's prompt at create time
-- by the app, capped at 5 per comparison there.
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
-- "opinion changed" tracking — table only. change_vote()/
-- set_last_vote_change_reason()/get_vote_change_count() land in I2
-- alongside the vote-switch reconciliation.
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

-- ============================================================
-- content-preference dials ("show me more/less" per category) — table
-- only. The weight multiplier inside get_feed_order lands in I3.
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

-- ============================================================
-- onboarding warmup stat — "N preferences discovered", read off
-- preference_signals.
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
