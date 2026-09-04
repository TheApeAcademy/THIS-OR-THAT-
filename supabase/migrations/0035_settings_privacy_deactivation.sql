-- Settings architecture, part 1: granular audience-level privacy (separate
-- from the existing show_play_score/show_streak/show_dna toggles, which
-- control which sections render ON an already-visible card — these new
-- columns control WHO can see the card/preferences/social links/
-- compatibility result at all), a country field (needed by later phases'
-- leaderboard filters and Global Pulse), and account deactivation.

alter table public.profiles
  add column country text,
  add column card_visibility text not null default 'public'
    check (card_visibility in ('public', 'followers', 'private')),
  add column preference_visibility text not null default 'public'
    check (preference_visibility in ('public', 'followers', 'private')),
  add column social_links_visibility text not null default 'public'
    check (social_links_visibility in ('public', 'followers', 'private')),
  add column compatibility_visibility text not null default 'public'
    check (compatibility_visibility in ('public', 'followers', 'private')),
  add column deactivated_at timestamptz;

-- Deactivated users lose write access, same restrictive-policy shape as
-- the suspended-user checks in 0009_moderation.sql. Unlike suspension,
-- deactivation is self-service and reversible from Settings.
create policy "deactivated users cannot vote"
  on public.votes as restrictive for insert
  with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.deactivated_at is not null)
  );

create policy "deactivated users cannot comment"
  on public.comments as restrictive for insert
  with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.deactivated_at is not null)
  );

create policy "deactivated users cannot create comparisons"
  on public.comparisons as restrictive for insert
  with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.deactivated_at is not null)
  );

-- Discovery surfaces (feed + trending) also exclude deactivated authors,
-- same treatment as a blocked/muted creator — their content stops
-- surfacing to new viewers while deactivated, without needing every
-- content read path in the app to join back to profiles.
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

create or replace function public.get_trending_comparisons(p_category_id uuid default null, p_limit int default 15)
returns table(comparison_id uuid)
language sql
stable
as $$
  select c.id
  from public.comparisons c
  where c.status = 'active'
    and (p_category_id is null or c.category_id = p_category_id)
    and (c.creator_id is null or not exists (
      select 1 from public.profiles p where p.id = c.creator_id and p.deactivated_at is not null
    ))
  order by (
    exp(-greatest(extract(epoch from (now() - c.created_at)) / 86400.0 - 1, 0) / 14.0)
    + ln(1 + c.vote_count + c.comment_count * 3) / (1 + extract(epoch from (now() - c.created_at)) / 86400.0)
  ) desc
  limit p_limit;
$$;
