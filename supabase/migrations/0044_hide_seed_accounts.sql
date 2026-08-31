-- Seed/bot accounts (profiles.is_seed_account) should never surface as
-- competitors on the leaderboard, even if a future seed batch ever gives
-- them play_stats. Defense in depth: today they simply have none.
create or replace function public.get_leaderboard(p_subject text default null, p_limit int default 20)
returns table(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  correct bigint,
  total bigint
)
language sql
stable
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    sum(ps.correct) as correct,
    sum(ps.total) as total
  from public.play_stats ps
  join public.profiles p on p.id = ps.user_id
  where (p_subject is null or ps.subject = p_subject)
    and p.is_seed_account = false
  group by p.id, p.username, p.display_name, p.avatar_url
  having sum(ps.total) > 0
  order by sum(ps.correct) desc, sum(ps.total) asc, p.username asc
  limit p_limit;
$$;

create or replace function public.get_user_rank(p_user_id uuid, p_subject text default null)
returns table(
  rank_position bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  correct bigint,
  total bigint
)
language sql
stable
as $$
  with totals as (
    select
      p.id as user_id,
      p.username,
      p.display_name,
      p.avatar_url,
      sum(ps.correct) as correct,
      sum(ps.total) as total
    from public.play_stats ps
    join public.profiles p on p.id = ps.user_id
    where (p_subject is null or ps.subject = p_subject)
      and p.is_seed_account = false
    group by p.id, p.username, p.display_name, p.avatar_url
    having sum(ps.total) > 0
  ),
  ranked as (
    select
      rank() over (order by correct desc, total asc, username asc) as rank_position,
      *
    from totals
  )
  select rank_position, user_id, username, display_name, avatar_url, correct, total
  from ranked
  where user_id = p_user_id;
$$;

-- Real user-created comparisons start at 0 votes, so the prior threshold of
-- 5 meant "Featured" would only ever surface old seed content until real
-- content organically caught up. Lower it so new content has a realistic
-- shot sooner. A tuning change, not a correctness fix.
create or replace function public.get_daily_featured_comparison(p_min_votes int default 2)
returns uuid
language sql
stable
as $$
  select id
  from public.comparisons
  where status = 'active' and vote_count >= p_min_votes
  order by md5(current_date::text || id::text)
  limit 1;
$$;
