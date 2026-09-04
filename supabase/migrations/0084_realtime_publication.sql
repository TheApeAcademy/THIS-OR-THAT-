-- Integration step (I1, safe layer): adds the tables the comparison
-- detail page needs live updates from to Supabase's realtime publication.
-- postgres_changes events still respect each table's existing RLS — this
-- only turns on the change feed, it doesn't loosen who can see what.
--
-- Main already added card_views to this publication (0050) — a different
-- table, no collision.
alter publication supabase_realtime add table public.comparisons;
alter publication supabase_realtime add table public.comparison_options;
alter publication supabase_realtime add table public.comments;
