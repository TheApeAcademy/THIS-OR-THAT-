-- Votes disappear on cascade (e.g. account deletion), which must also decrement
-- the denormalized vote_count counters on comparison_options/comparisons —
-- the original trigger only handled inserts.
create function public.handle_deleted_vote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.comparison_options set vote_count = greatest(vote_count - 1, 0) where id = old.option_id;
  update public.comparisons set vote_count = greatest(vote_count - 1, 0) where id = old.comparison_id;
  return old;
end;
$$;

create trigger on_vote_deleted
  after delete on public.votes
  for each row execute function public.handle_deleted_vote();

-- Supabase auto-grants EXECUTE to anon/authenticated via a post-creation event
-- trigger that fires after this migration's own revoke, so the revoke has to
-- land in its own follow-up migration (see 0004) to actually stick.
