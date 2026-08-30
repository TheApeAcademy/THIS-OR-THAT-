-- TikTok-style feed diversity: interleave categories instead of showing
-- them in created_at clusters. Ranks each category's comparisons
-- independently (random order within category), then returns them
-- round-robin — so the first N ids span up to N different categories
-- before repeating any one category.
create or replace function public.get_feed_order(p_limit int default 30)
returns table(comparison_id uuid)
language sql
stable
as $$
  select id from (
    select
      c.id,
      row_number() over (partition by c.category_id order by random()) as rn,
      random() as tiebreak
    from public.comparisons c
    where c.status = 'active'
  ) ranked
  order by rn, tiebreak
  limit p_limit;
$$;
