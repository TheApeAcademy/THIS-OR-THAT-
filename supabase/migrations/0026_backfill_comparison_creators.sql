-- Attribute every comparison to one of the seed accounts so the feed shows
-- a real-looking author on every post. Deterministic hash-based assignment
-- (not a plain `order by random() limit 1` scalar subquery — Postgres
-- hoists that as a single InitPlan when it isn't correlated to the outer
-- row, giving every row the same value) spreads posts evenly across all
-- seed accounts.
with bots as (
  select array_agg(id order by id) as ids, count(*) as n
  from public.profiles where is_seed_account = true
)
update public.comparisons c
set creator_id = bots.ids[1 + mod(abs(hashtext(c.id::text)), bots.n)]
from bots
where c.creator_id is null or c.creator_id not in (select id from public.profiles);
