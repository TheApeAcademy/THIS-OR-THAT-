-- Surface the real profile photo (falling back to the 3D headshot client-
-- side) on leaderboard rows too. The return shape changes, so the existing
-- functions must be dropped before recreating (CREATE OR REPLACE cannot
-- change a function's OUT-parameter row type).
drop function if exists public.get_leaderboard(text, int);
drop function if exists public.get_user_rank(uuid, text);

create function public.get_leaderboard(p_subject text default null, p_limit int default 20)
returns table(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  profile_photo_url text,
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
    p.profile_photo_url,
    sum(ps.correct) as correct,
    sum(ps.total) as total
  from public.play_stats ps
  join public.profiles p on p.id = ps.user_id
  where (p_subject is null or ps.subject = p_subject)
    and p.is_seed_account = false
  group by p.id, p.username, p.display_name, p.avatar_url, p.profile_photo_url
  having sum(ps.total) > 0
  order by sum(ps.correct) desc, sum(ps.total) asc, p.username asc
  limit p_limit;
$$;

create function public.get_user_rank(p_user_id uuid, p_subject text default null)
returns table(
  rank_position bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  profile_photo_url text,
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
      p.profile_photo_url,
      sum(ps.correct) as correct,
      sum(ps.total) as total
    from public.play_stats ps
    join public.profiles p on p.id = ps.user_id
    where (p_subject is null or ps.subject = p_subject)
      and p.is_seed_account = false
    group by p.id, p.username, p.display_name, p.avatar_url, p.profile_photo_url
    having sum(ps.total) > 0
  ),
  ranked as (
    select
      rank() over (order by correct desc, total asc, username asc) as rank_position,
      *
    from totals
  )
  select rank_position, user_id, username, display_name, avatar_url, profile_photo_url, correct, total
  from ranked
  where user_id = p_user_id;
$$;
