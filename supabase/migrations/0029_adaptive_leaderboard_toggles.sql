-- Adaptive home feed: once a user has built up preference_dna, bias category
-- ordering toward what they engage with more, while still interleaving every
-- category (never a full filter bubble) and keeping fresh accounts on the
-- existing uniform-random diverse order.
drop function if exists public.get_feed_order(integer);

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
  )
  select id from (
    select
      c.id,
      row_number() over (partition by c.category_id order by random()) / (w.weight * (0.7 + random() * 0.6)) as rank_key,
      random() as tiebreak
    from public.comparisons c
    join weights w on w.category_id = c.category_id
    where c.status = 'active'
  ) ranked
  order by rank_key, tiebreak
  limit p_limit;
$$;

-- Overall or per-subject Play leaderboard, ranked by correct answers.
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
  where p_subject is null or ps.subject = p_subject
  group by p.id, p.username, p.display_name, p.avatar_url
  having sum(ps.total) > 0
  order by sum(ps.correct) desc, sum(ps.total) asc, p.username asc
  limit p_limit;
$$;

-- More optional card features get their own toggle, matching show_play_score.
alter table public.profiles add column if not exists show_streak boolean not null default true;
alter table public.profiles add column if not exists show_dna boolean not null default true;
