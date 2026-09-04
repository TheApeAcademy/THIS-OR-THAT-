-- Integration step (I2): the one genuinely new notification type our
-- branch had that main's notifications system doesn't cover yet.
--
-- Everything else our branch's notifications did (follow, comment on your
-- comparison, reply to your comment, @mention) is already implemented by
-- main's polymorphic notifications table and handle_comment_notify() —
-- confirmed by reading both trigger bodies side by side. So this migration
-- does NOT recreate the notifications table (main's version stays
-- authoritative) — it only widens the type check and adds the one missing
-- trigger, following the exact widening pattern main already uses in
-- 0052/0066 (drop + re-add the check constraint).
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'like_comparison', 'like_card', 'comment_comparison', 'comment_card',
    'reply_comment', 'follow', 'mention', 'card_view', 'debate_result',
    'duel_challenge_received', 'duel_challenge_accepted', 'duel_challenge_declined',
    'comment_like'
  ));

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
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (v_comment_author, new.user_id, 'comment_like', 'comparison', v_comparison_id);
  end if;
  return new;
end;
$$;

create trigger on_comment_like_notify
  after insert on public.comment_likes
  for each row execute function public.handle_comment_like_notify();

revoke execute on function public.handle_comment_like_notify() from anon, authenticated;
