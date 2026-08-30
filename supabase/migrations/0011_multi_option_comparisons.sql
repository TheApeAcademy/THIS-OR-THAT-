-- Allow comparisons to have up to 4 options instead of exactly 2. Votes,
-- comments, and the moderation/rate-limit policies already reference
-- option_id generically, so only the side check + its supporting index
-- need to change.
alter table public.comparison_options
  drop constraint comparison_options_side_check;

alter table public.comparison_options
  add constraint comparison_options_side_check check (side in ('a', 'b', 'c', 'd'));
