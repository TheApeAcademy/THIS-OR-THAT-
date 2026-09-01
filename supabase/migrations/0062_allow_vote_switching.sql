-- Voting is a preference, not a one-shot commitment: a user should be able
-- to change their pick on a comparison at any time (just never have two
-- options selected at once, which the existing unique(user_id,
-- comparison_id) constraint already guarantees). Today votes are
-- insert-only, so a repeat vote hits that constraint and is silently
-- dropped. This adds the missing UPDATE path.
create policy "users can update own votes"
  on public.votes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Mirrors handle_new_vote/handle_deleted_vote: when an existing vote's
-- option_id changes, move the tile counts across (old -1, new +1).
-- comparisons.vote_count is untouched — it's still one vote, just on a
-- different option. Preference DNA is untouched too: its math is a
-- per-category vote *count*, and switching stays within the same
-- comparison/category, so the count doesn't change.
create function public.handle_vote_switch()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.option_id is distinct from old.option_id then
    update public.comparison_options set vote_count = vote_count - 1 where id = old.option_id;
    update public.comparison_options set vote_count = vote_count + 1 where id = new.option_id;
  end if;
  return new;
end;
$$;

create trigger on_vote_switched
  after update on public.votes
  for each row execute function public.handle_vote_switch();

revoke execute on function public.handle_vote_switch from anon, authenticated;
