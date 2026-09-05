-- Owner-only comparison controls: pin to profile, lock new comments.
alter table public.comparisons add column pinned_at timestamptz;
alter table public.comparisons add column comments_locked boolean not null default false;

-- Enforce the lock server-side (not just in the UI) - a locked debate
-- rejects new comment inserts regardless of client behavior.
create function public.check_comments_not_locked()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_locked boolean;
begin
  select comments_locked into v_locked from public.comparisons where id = new.comparison_id;
  if v_locked then
    raise exception 'Comments are locked on this debate.';
  end if;
  return new;
end;
$$;

create trigger enforce_comments_not_locked
  before insert on public.comments
  for each row execute function public.check_comments_not_locked();
