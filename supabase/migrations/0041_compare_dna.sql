-- Interest/topic-overlap similarity from preference_dna.breakdown — a
-- second, independent metric from compare_users' literal vote-agreement.
-- No security definer needed: preference_dna and categories are both
-- publicly readable already (unlike votes/comments, which is why
-- compare_users needs it).
create function public.compare_dna(user_a uuid, user_b uuid)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with breakdown_a as (
    select e.key as slug, (e.value->>'pct')::numeric as pct
    from public.preference_dna pd, jsonb_each(pd.breakdown) as e
    where pd.user_id = user_a
  ),
  breakdown_b as (
    select e.key as slug, (e.value->>'pct')::numeric as pct
    from public.preference_dna pd, jsonb_each(pd.breakdown) as e
    where pd.user_id = user_b
  ),
  unioned as (
    select
      coalesce(a.slug, b.slug) as slug,
      coalesce(a.pct, 0) as pct_a,
      coalesce(b.pct, 0) as pct_b
    from breakdown_a a
    full outer join breakdown_b b on a.slug = b.slug
  )
  select jsonb_build_object(
    'dna_similarity_pct', (
      select case when count(*) > 0 then round(100 - avg(abs(pct_a - pct_b)), 1) else null end
      from unioned
    ),
    'top_shared_categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', u.slug, 'label', cat.label, 'emoji', cat.emoji,
        'pct_a', u.pct_a, 'pct_b', u.pct_b
      ) order by least(u.pct_a, u.pct_b) desc)
      from (select * from unioned where pct_a > 0 and pct_b > 0 limit 3) u
      join public.categories cat on cat.slug = u.slug
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;
