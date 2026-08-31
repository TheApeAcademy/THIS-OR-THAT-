-- Extend the comparison-comment notify trigger to also detect @mentions.
create or replace function public.handle_comment_notify()
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

  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
  select p.id, new.user_id, 'mention', 'comparison', new.comparison_id
  from (
    select distinct lower(m[1]) as username
    from regexp_matches(new.body, '@([a-z0-9_]{3,20})', 'gi') as m
  ) mentioned
  join public.profiles p on lower(p.username) = mentioned.username
  where p.id <> new.user_id;

  return new;
end;
$$;

-- Replace the card-comment notify trigger to add reply handling (now that
-- parent_comment_id exists) plus the same @mention scan.
create or replace function public.handle_card_comment_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner_id uuid;
  v_parent_author_id uuid;
begin
  select user_id into v_owner_id from public.cards where id = new.card_id;
  if v_owner_id is not null and v_owner_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (v_owner_id, new.user_id, 'comment_card', 'card', new.card_id);
  end if;

  if new.parent_comment_id is not null then
    select user_id into v_parent_author_id from public.card_comments where id = new.parent_comment_id;
    if v_parent_author_id is not null and v_parent_author_id <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
      values (v_parent_author_id, new.user_id, 'reply_comment', 'card_comment', new.id);
    end if;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
  select p.id, new.user_id, 'mention', 'card', new.card_id
  from (
    select distinct lower(m[1]) as username
    from regexp_matches(new.body, '@([a-z0-9_]{3,20})', 'gi') as m
  ) mentioned
  join public.profiles p on lower(p.username) = mentioned.username
  where p.id <> new.user_id;

  return new;
end;
$$;
