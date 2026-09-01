-- Card safety system, step 3: durable notification history for card views,
-- parallel to (not a replacement for) the live realtime popup which
-- subscribes to card_views INSERT directly on the client. Anonymous and
-- self-views never create a notifications row (no addressable identity to
-- attribute durable history to, and anonymous hits skew toward bots), but
-- they still fire the live popup via the raw INSERT.
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'like_comparison', 'like_card', 'comment_comparison', 'comment_card',
    'reply_comment', 'follow', 'mention', 'card_view'
  ));

create function public.handle_card_view_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.viewer_id is not null and new.viewer_id <> new.owner_id then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (new.owner_id, new.viewer_id, 'card_view', 'card', new.card_id);
  end if;
  return new;
end;
$$;

create trigger on_card_view_notify
  after insert on public.card_views
  for each row execute function public.handle_card_view_notify();
