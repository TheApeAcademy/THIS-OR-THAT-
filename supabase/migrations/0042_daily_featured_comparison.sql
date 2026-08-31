-- Deterministic daily rotation, no new table, no manual curation. A
-- pragmatic simplification in place of admin/editorial tooling — a
-- manual-override table could be layered in later without breaking anything
-- that calls this function.
create function public.get_daily_featured_comparison(p_min_votes int default 5)
returns uuid
language sql
stable
as $$
  select id
  from public.comparisons
  where status = 'active' and vote_count >= p_min_votes
  order by md5(current_date::text || id::text)
  limit 1;
$$;
