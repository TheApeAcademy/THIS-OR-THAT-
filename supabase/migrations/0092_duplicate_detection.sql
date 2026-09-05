-- Fuzzy duplicate-debate detection at Create time. pg_trgm is a standard,
-- officially-supported Postgres/Supabase extension for trigram similarity -
-- not previously enabled anywhere in this schema, first use here.
create extension if not exists pg_trgm;

create index if not exists idx_comparisons_prompt_trgm
  on public.comparisons using gin (prompt gin_trgm_ops);

create function public.find_similar_comparisons(p_prompt text, p_limit int default 3)
returns table(id uuid, prompt text, similarity real)
language sql
stable
as $$
  select c.id, c.prompt, similarity(c.prompt, p_prompt) as similarity
  from public.comparisons c
  where c.status = 'active'
    and c.prompt is not null
    and similarity(c.prompt, p_prompt) > 0.35
  order by similarity desc
  limit p_limit;
$$;
