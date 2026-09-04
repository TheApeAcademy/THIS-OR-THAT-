-- Phase 13 — Card & trust polish: comment quality reactions (additive to
-- the existing like, not a replacement — see commit message), card
-- theming, card version history, and admin-granted verification badges.

-- ============================================================
-- comment reactions
-- ============================================================
create table public.comment_reactions (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('helpful', 'funny', 'convincing')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, type)
);

alter table public.comment_reactions enable row level security;

create policy "comment reactions are publicly readable"
  on public.comment_reactions for select
  using (true);

create policy "users can react as self"
  on public.comment_reactions for insert
  with check (auth.uid() = user_id);

create policy "users can remove own reaction"
  on public.comment_reactions for delete
  using (auth.uid() = user_id);

create index idx_comment_reactions_comment on public.comment_reactions (comment_id);

alter table public.comments
  add column helpful_count int not null default 0,
  add column funny_count int not null default 0,
  add column convincing_count int not null default 0;

create function public.handle_comment_reaction_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_comment_id uuid := coalesce(new.comment_id, old.comment_id);
  v_type text := coalesce(new.type, old.type);
  v_delta int := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  if v_type = 'helpful' then
    update public.comments set helpful_count = greatest(helpful_count + v_delta, 0) where id = v_comment_id;
  elsif v_type = 'funny' then
    update public.comments set funny_count = greatest(funny_count + v_delta, 0) where id = v_comment_id;
  elsif v_type = 'convincing' then
    update public.comments set convincing_count = greatest(convincing_count + v_delta, 0) where id = v_comment_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger on_comment_reaction_change
  after insert or delete on public.comment_reactions
  for each row execute function public.handle_comment_reaction_change();

revoke execute on function public.handle_comment_reaction_change() from anon, authenticated;

-- ============================================================
-- card theming — a small fixed palette (a key, not arbitrary CSS), kept
-- separate from `snapshot` so regenerating the preference-DNA snapshot
-- (lib/card.ts's ensureCard, called on every card view) never clobbers it.
-- ============================================================
alter table public.cards
  add column theme text not null default 'blue'
    check (theme in ('blue', 'purple', 'green', 'sunset', 'mono'));

-- ============================================================
-- card version history — a lightweight log of past snapshots, not a
-- restore mechanism. share_slug is stable regardless (already true before
-- this migration), so old shared links keep resolving to the current
-- card; this just lets the owner see when/how it last changed.
-- ============================================================
create table public.card_versions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  snapshot jsonb not null,
  theme text not null,
  created_at timestamptz not null default now()
);

alter table public.card_versions enable row level security;

create policy "users can view own card history"
  on public.card_versions for select
  using (exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid()));

create index idx_card_versions_card on public.card_versions (card_id, created_at desc);

-- ============================================================
-- verification badges — admin-granted only, no self-serve flow.
-- ============================================================
alter table public.profiles
  add column verified_at timestamptz,
  add column verification_type text not null default 'none'
    check (verification_type in ('none', 'identity', 'social'));
