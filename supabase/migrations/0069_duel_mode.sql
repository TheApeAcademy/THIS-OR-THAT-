-- Duel Mode: two specific people debate head-to-head, each stating their
-- own stance. A duel is a normal 2-option comparison underneath (reuses
-- every existing verdict/percentage/feed piece) — each comparison_options
-- row just gains an optional debater identity + their point.
alter table public.comparison_options add column claimed_by uuid references public.profiles(id);
alter table public.comparison_options add column statement text
  check (statement is null or char_length(statement) <= 220);

-- Staging table for the challenge/accept-decline handshake that happens
-- BEFORE a duel becomes a real, feed-visible comparison. target_user_id
-- null means an open callout (whoever responds first claims the other
-- side); non-null means a direct challenge to that specific person.
create table public.duel_challenges (
  id uuid primary key default gen_random_uuid(),
  prompt text check (prompt is null or char_length(prompt) <= 200),
  category_id uuid references public.categories(id),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  challenger_label text not null check (char_length(challenger_label) between 1 and 60),
  challenger_statement text check (challenger_statement is null or char_length(challenger_statement) <= 220),
  target_user_id uuid references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  comparison_id uuid references public.comparisons(id),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint duel_challenges_no_self_challenge check (target_user_id is null or target_user_id <> challenger_id)
);

alter table public.duel_challenges enable row level security;

create policy "involved parties or open callouts are visible"
  on public.duel_challenges for select
  using (
    challenger_id = auth.uid()
    or target_user_id = auth.uid()
    or (target_user_id is null and status = 'pending')
  );

create policy "users can create their own challenge"
  on public.duel_challenges for insert
  with check (challenger_id = auth.uid());

-- Direct updates are only ever used to decline (accepting goes through
-- respond_to_duel_challenge below, which needs security-definer atomicity
-- for the "first claim wins" race on open callouts).
create policy "the target can decline a direct challenge"
  on public.duel_challenges for update
  using (status = 'pending' and target_user_id = auth.uid())
  with check (status = 'declined');

create index idx_duel_challenges_target on public.duel_challenges (target_user_id, status);
create index idx_duel_challenges_open on public.duel_challenges (status) where target_user_id is null;

-- Widen entity_type so a duel-challenge notification (fired before any
-- comparison exists) has somewhere to point.
alter table public.notifications drop constraint notifications_entity_type_check;
alter table public.notifications add constraint notifications_entity_type_check
  check (entity_type in ('comparison', 'card', 'comment', 'card_comment', 'duel_challenge'));

create function public.handle_duel_challenge_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.target_user_id is not null then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (new.target_user_id, new.challenger_id, 'duel_challenge_received', 'duel_challenge', new.id);
  end if;
  return new;
end;
$$;

create trigger on_duel_challenge_notify
  after insert on public.duel_challenges
  for each row execute function public.handle_duel_challenge_notify();

create function public.handle_duel_response_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;
  if new.status = 'accepted' then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (new.challenger_id, new.target_user_id, 'duel_challenge_accepted', 'comparison', new.comparison_id);
  elsif new.status = 'declined' then
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    values (new.challenger_id, new.target_user_id, 'duel_challenge_declined', 'duel_challenge', new.id);
  end if;
  return new;
end;
$$;

create trigger on_duel_response_notify
  after update on public.duel_challenges
  for each row execute function public.handle_duel_response_notify();

-- Atomically claims/accepts (or declines) a challenge and, on accept,
-- creates the real comparison + both comparison_options rows in the same
-- transaction. Security definer so the "for update" row lock can safely
-- coordinate the first-claim-wins race on open callouts, while the
-- function body itself enforces every check RLS would otherwise cover.
create function public.respond_to_duel_challenge(
  p_challenge_id uuid,
  p_accept boolean,
  p_option_label text default null,
  p_statement text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.duel_challenges%rowtype;
  v_caller uuid := auth.uid();
  v_comparison_id uuid;
  v_label text;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_challenge from public.duel_challenges where id = p_challenge_id for update;
  if not found then
    raise exception 'Challenge not found';
  end if;
  if v_challenge.status <> 'pending' then
    raise exception 'This challenge has already been resolved.';
  end if;
  if v_challenge.challenger_id = v_caller then
    raise exception 'You can''t respond to your own challenge.';
  end if;
  if v_challenge.target_user_id is not null and v_challenge.target_user_id <> v_caller then
    raise exception 'This challenge isn''t addressed to you.';
  end if;

  if not p_accept then
    if v_challenge.target_user_id is null then
      raise exception 'Open challenges can''t be declined.';
    end if;
    update public.duel_challenges set status = 'declined', responded_at = now() where id = p_challenge_id;
    return null;
  end if;

  v_label := trim(coalesce(p_option_label, ''));
  if v_label = '' then
    raise exception 'Write your side of the debate first.';
  end if;
  if char_length(v_label) > 60 then
    raise exception 'Keep it under 60 characters.';
  end if;

  insert into public.comparisons (creator_id, category_id, prompt)
  values (v_caller, v_challenge.category_id, v_challenge.prompt)
  returning id into v_comparison_id;

  insert into public.comparison_options (comparison_id, side, label, claimed_by, statement)
  values
    (v_comparison_id, 'a', v_challenge.challenger_label, v_challenge.challenger_id, v_challenge.challenger_statement),
    (v_comparison_id, 'b', v_label, v_caller, nullif(trim(coalesce(p_statement, '')), ''));

  update public.duel_challenges
    set status = 'accepted', target_user_id = v_caller, comparison_id = v_comparison_id, responded_at = now()
    where id = p_challenge_id;

  return v_comparison_id;
end;
$$;

revoke all on function public.respond_to_duel_challenge(uuid, boolean, text, text) from public;
grant execute on function public.respond_to_duel_challenge(uuid, boolean, text, text) to authenticated;
