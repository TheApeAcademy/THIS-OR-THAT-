-- Allow comparisons to have up to 6 options instead of 4, so multi-way
-- match-ups (e.g. 3+ artists/players) have more room and the option-tile
-- grid has enough tiles to actually look like a varied, masonry-style
-- layout instead of a plain 2x2.
alter table public.comparison_options
  drop constraint comparison_options_side_check;

alter table public.comparison_options
  add constraint comparison_options_side_check check (side in ('a', 'b', 'c', 'd', 'e', 'f'));
