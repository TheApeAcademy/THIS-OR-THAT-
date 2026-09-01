-- "Most Divisive" ranking for Discover: comparisons where the top two
-- options are closest in vote count, generalizing across 2-6 options by
-- comparing raw vote-count gap (not percentages) so it needs no special
-- casing per option count. Requires at least 5 total votes to avoid noisy
-- small samples (a 1-1 split on 2 votes isn't meaningfully "divisive").
create function public.get_most_divisive_comparisons(p_limit int default 15)
returns table(comparison_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select c.id
  from public.comparisons c
  join lateral (
    select
      coalesce(sum(o.vote_count), 0) as total_votes,
      coalesce(max(o.vote_count), 0) as top_votes,
      (
        select o2.vote_count
        from public.comparison_options o2
        where o2.comparison_id = c.id
        order by o2.vote_count desc
        offset 1 limit 1
      ) as runner_up_votes
    from public.comparison_options o
    where o.comparison_id = c.id
  ) stats on true
  where c.status = 'active'
    and (c.expires_at is null or c.expires_at > now())
    and stats.total_votes >= 5
  order by (stats.top_votes - coalesce(stats.runner_up_votes, 0)) asc, stats.total_votes desc
  limit p_limit;
$$;
