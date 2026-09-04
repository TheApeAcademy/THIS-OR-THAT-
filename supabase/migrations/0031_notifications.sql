-- Notifications: the Activity system. Follows, comments on your comparisons,
-- replies to your comments, and likes on your comments all generate a row
-- here via security-definer triggers — clients never insert directly.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('follow', 'comment', 'reply', 'comment_like')),
  comparison_id uuid references public.comparisons(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "users can view own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy "users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

create policy "users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = recipient_id);

-- No insert policy: rows are only ever written by the security-definer
-- trigger functions below, never directly by a client.

create index idx_notifications_recipient on public.notifications (recipient_id, created_at desc);
create index idx_notifications_unread on public.notifications (recipient_id) where read_at is null;

-- ============================================================
-- follow -> notification
-- ============================================================
create function public.handle_follow_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type)
  values (new.followee_id, new.follower_id, 'follow');
  return new;
end;
$$;

create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.handle_follow_notify();

-- ============================================================
-- comment -> notification (reply to a comment, or comment on your comparison)
-- ============================================================
create function public.handle_comment_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_parent_author uuid;
  v_creator_id uuid;
begin
  if new.parent_comment_id is not null then
    select user_id into v_parent_author from public.comments where id = new.parent_comment_id;
    if v_parent_author is not null and v_parent_author <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, comparison_id, comment_id)
      values (v_parent_author, new.user_id, 'reply', new.comparison_id, new.id);
    end if;
  else
    select creator_id into v_creator_id from public.comparisons where id = new.comparison_id;
    if v_creator_id is not null and v_creator_id <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, comparison_id, comment_id)
      values (v_creator_id, new.user_id, 'comment', new.comparison_id, new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.handle_comment_notify();

-- ============================================================
-- comment like -> notification
-- ============================================================
create function public.handle_comment_like_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_comment_author uuid;
  v_comparison_id uuid;
begin
  select user_id, comparison_id into v_comment_author, v_comparison_id
  from public.comments where id = new.comment_id;

  if v_comment_author is not null and v_comment_author <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, comparison_id, comment_id)
    values (v_comment_author, new.user_id, 'comment_like', v_comparison_id, new.comment_id);
  end if;
  return new;
end;
$$;

create trigger on_comment_like_notify
  after insert on public.comment_likes
  for each row execute function public.handle_comment_like_notify();

revoke execute on function public.handle_follow_notify() from anon, authenticated;
revoke execute on function public.handle_comment_notify() from anon, authenticated;
revoke execute on function public.handle_comment_like_notify() from anon, authenticated;
