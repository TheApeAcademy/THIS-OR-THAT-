-- Integration step (I1, safe layer): granular audience-level privacy
-- (separate from the existing show_play_score/show_streak/show_dna
-- toggles, which control which sections render ON an already-visible
-- card — these new columns control WHO can see the card/preferences/
-- social links/compatibility result at all), a country field (needed by
-- leaderboard filters and Global Pulse), and account deactivation.
--
-- The get_feed_order deactivation-exclusion clause is deliberately NOT
-- included here — folded into the single hand-merged get_feed_order
-- migration alongside main's own independent changes to that function.

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

-- Discovery surfaces also exclude deactivated authors, same treatment as
-- a blocked/muted creator — their content stops surfacing to new viewers
-- while deactivated.
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
