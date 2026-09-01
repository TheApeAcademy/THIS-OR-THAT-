-- Re-run the 0026 seed-account attribution for the new batch of comparisons
-- added in 0056, so they also show a "This or That" author instead of no
-- author row at all.
with bots as (
  select array_agg(id order by id) as ids, count(*) as n
  from public.profiles where is_seed_account = true
)
update public.comparisons c
set creator_id = bots.ids[1 + mod(abs(hashtext(c.id::text)), bots.n)]
from bots
where c.creator_id is null or c.creator_id not in (select id from public.profiles);
