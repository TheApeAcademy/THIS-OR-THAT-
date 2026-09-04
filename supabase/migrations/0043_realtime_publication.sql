-- Phase 11 — Real-time: adds the tables the comparison detail page needs
-- live updates from to Supabase's realtime publication. postgres_changes
-- events still respect each table's existing RLS (active comparisons are
-- select using (status = 'active' or creator_id = auth.uid()), comments
-- select using (status = 'active'), options follow their parent
-- comparison) — this only turns on the change feed, it doesn't loosen
-- who can see what.
alter publication supabase_realtime add table public.comparisons;
alter publication supabase_realtime add table public.comparison_options;
alter publication supabase_realtime add table public.comments;
