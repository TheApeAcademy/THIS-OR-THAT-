-- Expired time-boxed polls should age out of the main Home feed the same
-- way they age out of Discover's trending query — same signature as the
-- 0029 version, just with the expiry filter added.
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
      and (c.expires_at is null or c.expires_at > now())
  ) ranked
  order by rank_key, tiebreak
  limit p_limit;
$$;
