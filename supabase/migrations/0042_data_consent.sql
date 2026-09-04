-- Phase 10 — Data business & consent. This is plumbing and enforcement
-- only: the distinction between "use my data personally" and "use it in
-- aggregate," made explicit and actually gated at the two places this
-- repo currently does cross-user or personalized data use. No
-- advertising/licensing marketplace ships here — that's future work this
-- consent model exists to make legitimate, not something to fake now.

alter table public.profiles
  add column data_consent text not null default 'personalized'
    check (data_consent in ('none', 'anonymous', 'aggregated', 'personalized', 'advertising', 'research', 'licensing'));

-- 'personalized' matches what the app already effectively does for every
-- existing user today, so this migration doesn't silently downgrade
-- anyone's recommendation quality on rollout.

-- ============================================================
-- Global Pulse (0039) is the one place this repo aggregates votes across
-- users. A 'none' consent means the vote is excluded from that aggregate
-- entirely — everything else ('anonymous' and up) is fine to fold into a
-- 3+-vote, country-level count that never identifies the individual voter.
-- ============================================================
create or replace function public.get_global_pulse(p_comparison_id uuid)
returns table(country text, option_id uuid, votes bigint)
language sql
stable
security definer set search_path = public
as $$
  select p.country, v.option_id, count(*) as votes
  from public.votes v
  join public.profiles p on p.id = v.user_id
  where v.comparison_id = p_comparison_id
    and p.country is not null
    and p.data_consent != 'none'
  group by p.country, v.option_id
  having count(*) >= 3
  order by count(*) desc;
$$;

-- ============================================================
-- get_feed_order's personalization arm reads the viewer's OWN
-- preference_dna to weight their OWN feed — not cross-user aggregation,
-- but still "using this person's data to personalize their experience,"
-- which is exactly what a consent tier below 'personalized' should turn
-- off. Below that tier the category weighting falls back to the flat
-- floor every category already gets, not a broken/empty feed.
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
