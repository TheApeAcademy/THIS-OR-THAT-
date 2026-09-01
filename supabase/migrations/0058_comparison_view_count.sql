-- Track how many times a comparison has been seen, surfaced alongside
-- votes/likes/comments so creators can see real reach, not just engagement.
-- A simple counter (not a full events table like card_views) is enough here
-- since this is a vanity metric, not something access-gated or notified on.
alter table public.comparisons add column view_count int not null default 0;

-- Client-callable like bump_streak/record_play_answer: viewers (including
-- anonymous) increment their own view, bypassing the owner-only update
-- policy on comparisons via security definer.
create function public.increment_comparison_view(p_comparison_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.comparisons set view_count = view_count + 1 where id = p_comparison_id;
end;
$$;
