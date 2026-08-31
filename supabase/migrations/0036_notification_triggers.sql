-- comparison_likes -> notify the comparison's creator.
create function public.handle_comparison_like_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_creator_id uuid;
begin
  select creator_id into v_creator_id from public.comparisons where id = new.comparison_id;
  if v_creator_id is not null and v_creator_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (v_creator_id, new.user_id, 'like_comparison', 'comparison', new.comparison_id);
  end if;
  return new;
end;
$$;

create trigger on_comparison_like_notify
  after insert on public.comparison_likes
  for each row execute function public.handle_comparison_like_notify();

-- card_likes -> notify the card's owner.
create function public.handle_card_like_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  select user_id into v_owner_id from public.cards where id = new.card_id;
  if v_owner_id is not null and v_owner_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (v_owner_id, new.user_id, 'like_card', 'card', new.card_id);
  end if;
  return new;
end;
$$;

create trigger on_card_like_notify
  after insert on public.card_likes
  for each row execute function public.handle_card_like_notify();

-- comments (on comparisons) -> notify the comparison creator, and
-- separately the parent comment's author if this is a reply.
create function public.handle_comment_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_creator_id uuid;
  v_parent_author_id uuid;
begin
  select creator_id into v_creator_id from public.comparisons where id = new.comparison_id;
  if v_creator_id is not null and v_creator_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (v_creator_id, new.user_id, 'comment_comparison', 'comparison', new.comparison_id);
  end if;

  if new.parent_comment_id is not null then
    select user_id into v_parent_author_id from public.comments where id = new.parent_comment_id;
    if v_parent_author_id is not null and v_parent_author_id <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
      values (v_parent_author_id, new.user_id, 'reply_comment', 'comment', new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger on_comment_notify
  after insert on public.comments
  for each row execute function public.handle_comment_notify();

-- card_comments -> notify the card's owner. (Reply/mention handling for
-- card comments is added later once parent_comment_id exists on this table.)
create function public.handle_card_comment_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  select user_id into v_owner_id from public.cards where id = new.card_id;
  if v_owner_id is not null and v_owner_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (v_owner_id, new.user_id, 'comment_card', 'card', new.card_id);
  end if;
  return new;
end;
$$;

create trigger on_card_comment_notify
  after insert on public.card_comments
  for each row execute function public.handle_card_comment_notify();

-- follows -> notify the followee. follows_no_self_follow already guarantees
-- follower_id <> followee_id at insert time.
create function public.handle_follow_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
  values (new.followee_id, new.follower_id, 'follow', null, null);
  return new;
end;
$$;

create trigger on_follow_notify
  after insert on public.follows
  for each row execute function public.handle_follow_notify();
