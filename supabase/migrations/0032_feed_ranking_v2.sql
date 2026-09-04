-- Feed ranking v2: adds a "Not interested" signal (feed_dismissals), then
-- rewrites get_feed_order so the home feed actually implements the product
-- spec instead of near-uniform-random ordering:
--   - never resurface a comparison the user already voted on or dismissed
--   - freshness: new comparisons get a boost that decays over ~2 weeks
--   - trending: recent vote/comment volume relative to how long it's been live
--   - social affinity: a boost for comparisons from people the user follows
-- The existing preference-DNA category weighting and cross-category
-- interleaving (never a full filter bubble) are preserved unchanged.

create table public.feed_dismissals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comparison_id)
);

alter table public.feed_dismissals enable row level security;

create policy "users can view own dismissals"
  on public.feed_dismissals for select
  using (auth.uid() = user_id);

create policy "users can dismiss as self"
  on public.feed_dismissals for insert
  with check (auth.uid() = user_id);

create policy "users can undo own dismissal"
  on public.feed_dismissals for delete
  using (auth.uid() = user_id);

create index idx_feed_dismissals_user on public.feed_dismissals (user_id);

drop function if exists public.get_feed_order(uuid, integer);

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
      ) as weight
    from public.categories cat
    left join public.preference_dna pd on pd.user_id = p_user_id
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
  )
  select id from (
    select
      cand.id,
      row_number() over (
        partition by cand.category_id
        order by (
          -- freshness: full strength for the first day, then decays over ~2 weeks
          exp(-greatest(extract(epoch from (now() - cand.created_at)) / 86400.0 - 1, 0) / 14.0)
          -- trending: recent engagement relative to age (comments weighted higher — they're a stronger signal than a tap)
          + ln(1 + cand.vote_count + cand.comment_count * 3) / (1 + extract(epoch from (now() - cand.created_at)) / 86400.0)
          -- social affinity: comparisons from people this user follows
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
