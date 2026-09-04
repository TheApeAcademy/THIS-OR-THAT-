-- Integration step (I1, safe layer): the distinction between "use my data
-- personally" and "use it in aggregate," made explicit and gated at the
-- one place this repo currently aggregates votes across users
-- (get_global_pulse). No advertising/licensing marketplace ships here —
-- that's future work this consent model exists to make legitimate.
--
-- The get_feed_order consent-gating clause (the personalization arm
-- requiring >= 'personalized') is folded into the single hand-merged
-- get_feed_order migration (I3) instead of redefined here.

alter table public.profiles
  add column data_consent text not null default 'personalized'
    check (data_consent in ('none', 'anonymous', 'aggregated', 'personalized', 'advertising', 'research', 'licensing'));

-- 'personalized' matches what the app already effectively does for every
-- existing user today, so this migration doesn't silently downgrade
-- anyone's recommendation quality on rollout.

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
