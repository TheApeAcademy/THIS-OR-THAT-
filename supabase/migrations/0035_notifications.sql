-- In-app notifications for likes, comments, replies, and follows. type/
-- entity_type are widened up front to include 'mention'/'card_comment' even
-- though only a later migration (card comment threading) writes those
-- values — cheaper to size the constraint once than alter it later.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in (
    'like_comparison', 'like_card', 'comment_comparison', 'comment_card',
    'reply_comment', 'follow', 'mention'
  )),
  entity_type text check (entity_type in ('comparison', 'card', 'comment', 'card_comment')),
  entity_id uuid,
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

-- No insert policy: rows are written exclusively by security-definer
-- trigger functions (0036), matching the app's existing convention that
-- system/counter rows never have a public insert policy.

create index idx_notifications_recipient_unread on public.notifications (recipient_id, read_at);
create index idx_notifications_recipient_created on public.notifications (recipient_id, created_at desc);
