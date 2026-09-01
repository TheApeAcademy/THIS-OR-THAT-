-- "Run it back" — lets an expired time-boxed comparison spin up a fresh
-- round instead of just closing forever. Self-referencing so a lookup
-- ("has this one already been rematched?") is a simple indexed query.
alter table public.comparisons add column rematch_of_id uuid references public.comparisons(id);
create index idx_comparisons_rematch_of on public.comparisons (rematch_of_id) where rematch_of_id is not null;
