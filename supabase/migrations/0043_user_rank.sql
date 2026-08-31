-- Same ordering as get_leaderboard (sum(correct) desc, sum(total) asc,
-- username asc) so ranks returned here are always consistent with the
-- top-20 leaderboard. rank_position (not rank) to avoid ambiguity with the
-- rank() window function.
create function public.get_user_rank(p_user_id uuid, p_subject text default null)
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
    where p_subject is null or ps.subject = p_subject
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
