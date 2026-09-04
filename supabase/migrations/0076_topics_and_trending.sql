-- Search & Discovery overhaul, part 1: topics (a followable entity distinct
-- from the fixed categories list) and a standalone trending engine that
-- isn't gated on personalization, so it can power both Discover and the
-- new /search route's "before you type" surface.

-- ============================================================
-- topics
-- ============================================================
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id),
  slug text unique not null,
  label text not null,
  follower_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;

create policy "topics are publicly readable"
  on public.topics for select
  using (true);

create index idx_topics_category on public.topics (category_id);

create table public.comparison_topics (
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  primary key (comparison_id, topic_id)
);

alter table public.comparison_topics enable row level security;

create policy "comparison topics are publicly readable"
  on public.comparison_topics for select
  using (true);

create policy "creators can tag their own comparison with topics"
  on public.comparison_topics for insert
  with check (
    exists (
      select 1 from public.comparisons c
      where c.id = comparison_id and c.creator_id = auth.uid()
    )
  );

create policy "creators can remove topics from their own comparison"
  on public.comparison_topics for delete
  using (
    exists (
      select 1 from public.comparisons c
      where c.id = comparison_id and c.creator_id = auth.uid()
    )
  );

create index idx_comparison_topics_topic on public.comparison_topics (topic_id);

create table public.topic_follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.topic_follows enable row level security;

create policy "topic follows are publicly readable"
  on public.topic_follows for select
  using (true);

create policy "users can follow a topic as self"
  on public.topic_follows for insert
  with check (auth.uid() = user_id);

create policy "users can unfollow a topic as self"
  on public.topic_follows for delete
  using (auth.uid() = user_id);

create index idx_topic_follows_user on public.topic_follows (user_id);

create function public.handle_topic_follow_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.topics set follower_count = follower_count + 1 where id = new.topic_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.topics set follower_count = greatest(follower_count - 1, 0) where id = old.topic_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_topic_follow_change
  after insert or delete on public.topic_follows
  for each row execute function public.handle_topic_follow_change();

revoke execute on function public.handle_topic_follow_change() from anon, authenticated;

-- ============================================================
-- seed topics per category
-- ============================================================
insert into public.topics (category_id, slug, label)
select cat.id, t.slug, t.label
from (values
  ('technology', 'phones', 'Phones'),
  ('technology', 'apple', 'Apple'),
  ('technology', 'samsung', 'Samsung'),
  ('technology', 'ai', 'AI'),
  ('technology', 'laptops', 'Laptops'),
  ('cars', 'toyota', 'Toyota'),
  ('cars', 'bmw', 'BMW'),
  ('cars', 'mercedes', 'Mercedes'),
  ('cars', 'suvs', 'SUVs'),
  ('cars', 'evs', 'EVs'),
  ('music', 'hiphop', 'Hip-Hop'),
  ('music', 'afrobeats', 'Afrobeats'),
  ('music', 'pop', 'Pop'),
  ('fashion', 'sneakers', 'Sneakers'),
  ('fashion', 'streetwear', 'Streetwear'),
  ('travel', 'beaches', 'Beaches'),
  ('travel', 'citytrips', 'City Trips'),
  ('gaming', 'consoles', 'Consoles'),
  ('gaming', 'mobilegaming', 'Mobile Gaming'),
  ('sports', 'football', 'Football'),
  ('sports', 'basketball', 'Basketball'),
  ('food', 'fastfood', 'Fast Food'),
  ('food', 'coffee', 'Coffee'),
  ('movies', 'marvel', 'Marvel'),
  ('movies', 'action', 'Action')
) as t(category_slug, slug, label)
join public.categories cat on cat.slug = t.category_slug
on conflict (slug) do nothing;

-- One-time backfill: link existing comparisons to a topic when their
-- prompt/caption mentions it by name, so topic pages and search aren't
-- empty on day one. Same "best-effort content backfill" spirit as
-- 0026_backfill_comparison_creators.sql. Future comparisons get tagged
-- explicitly through the create flow (Phase 4).
insert into public.comparison_topics (comparison_id, topic_id)
select c.id, t.id
from public.comparisons c
join public.topics t on (
  c.prompt ilike '%' || t.label || '%' or coalesce(c.caption, '') ilike '%' || t.label || '%'
)
on conflict do nothing;

-- ============================================================
-- standalone trending engine — same freshness/velocity scoring as
-- get_feed_order, but not gated on a user's personalization so it can
-- power Discover and pre-query Search suggestions for anonymous visitors.
-- ============================================================
create function public.get_trending_comparisons(p_category_id uuid default null, p_limit int default 15)
returns table(comparison_id uuid)
language sql
stable
as $$
  select c.id
  from public.comparisons c
  where c.status = 'active'
    and (p_category_id is null or c.category_id = p_category_id)
  order by (
    exp(-greatest(extract(epoch from (now() - c.created_at)) / 86400.0 - 1, 0) / 14.0)
    + ln(1 + c.vote_count + c.comment_count * 3) / (1 + extract(epoch from (now() - c.created_at)) / 86400.0)
  ) desc
  limit p_limit;
$$;
