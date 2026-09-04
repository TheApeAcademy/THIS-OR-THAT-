-- Integration step (I3): hand-merge the three functions both main and
-- this branch independently redefined after their shared 0001-0030 base,
-- each read from main's actual current body (0061/0072/0046) before being
-- combined with this branch's own accumulated changes — nothing here is
-- guessed.

-- ============================================================
-- get_feed_order — main's contribution since the shared base: an
-- expires_at filter (0061), on the same preference_dna weight formula
-- (greatest(pct, 8)) both sides share. This branch's contribution: never
-- resurface an already-voted/dismissed comparison, exclude blocked/muted/
-- deactivated creators, a category_feed_prefs weight multiplier, consent-
-- gated personalization, and freshness/trending/social-affinity ranking
-- (replacing main's plain per-category random order). Every clause from
-- both sides is present below — nothing dropped.
-- ============================================================
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
    left join public.preference_dna pd
      on pd.user_id = p_user_id
      and coalesce(
        (select data_consent from public.profiles where id = p_user_id),
        'personalized'
      ) in ('personalized', 'advertising')
    left join public.category_feed_prefs cfp on cfp.user_id = p_user_id and cfp.category_id = cat.id
  ),
  candidates as (
    select c.id, c.category_id, c.creator_id, c.vote_count, c.comment_count, c.created_at
    from public.comparisons c
    where c.status = 'active'
      and (c.expires_at is null or c.expires_at > now())
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
      and (c.creator_id is null or not exists (
        select 1 from public.profiles p where p.id = c.creator_id and p.deactivated_at is not null
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
          -- trending: recent engagement relative to age
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

-- ============================================================
-- bump_streak — main's contribution: streak-freeze consumption (0072).
-- This branch's contribution: streak_3/streak_7 achievement inserts. Main's
-- full body is kept verbatim (including its correct implicit handling of
-- a first-ever call, where v_last is null and none of the date branches
-- match, falling through to the v_current := 1 else-branch) with the
-- achievement inserts appended at the end.
-- ============================================================
create or replace function public.bump_streak(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_last date;
  v_current int;
  v_longest int;
  v_freezes int;
begin
  if p_user_id <> auth.uid() then
    return;
  end if;

  select last_active_date, current_streak, longest_streak, streak_freezes
    into v_last, v_current, v_longest, v_freezes
    from public.profiles where id = p_user_id;

  if v_last = current_date then
    return;
  elsif v_last = current_date - 1 then
    v_current := v_current + 1;
  elsif v_last = current_date - 2 and v_freezes > 0 then
    v_current := v_current + 1;
    v_freezes := v_freezes - 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(v_longest, v_current);

  if v_current > 0 and v_current % 7 = 0 then
    v_freezes := least(3, v_freezes + 1);
  end if;

  update public.profiles
    set current_streak = v_current, longest_streak = v_longest, last_active_date = current_date, streak_freezes = v_freezes
    where id = p_user_id;

  if v_current >= 3 then
    insert into public.achievements (user_id, type) values (p_user_id, 'streak_3') on conflict do nothing;
  end if;
  if v_current >= 7 then
    insert into public.achievements (user_id, type) values (p_user_id, 'streak_7') on conflict do nothing;
  end if;
end;
$$;

-- ============================================================
-- get_leaderboard — main's contribution: profile_photo_url output column
-- and an is_seed_account filter (0046). This branch's contribution:
-- p_country / p_friends_of filter params. get_user_rank is untouched by
-- this branch and needs no merge — left exactly as main defines it.
-- Signature is changing (2 params -> 4), so this has to be a drop +
-- recreate like main's own 0046 migration, not a plain create or replace.
-- ============================================================
drop function if exists public.get_leaderboard(text, int);

create function public.get_leaderboard(
  p_subject text default null,
  p_limit int default 20,
  p_country text default null,
  p_friends_of uuid default null
)
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
    and (p_country is null or p.country = p_country)
    and (p_friends_of is null or exists (
      select 1 from public.follows f where f.follower_id = p_friends_of and f.followee_id = p.id
    ))
  group by p.id, p.username, p.display_name, p.avatar_url, p.profile_photo_url
  having sum(ps.total) > 0
  order by sum(ps.correct) desc, sum(ps.total) asc, p.username asc
  limit p_limit;
$$;
