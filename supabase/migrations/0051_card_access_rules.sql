-- Card safety system, step 2: extend the existing 3-boolean global-default
-- pattern (show_play_score/show_streak/show_dna) with 3 more fields, plus a
-- per-viewer override table. Absence of an override row, or a null field
-- within one, falls through to the owner's global default in profiles.
alter table public.profiles
  add column show_avatar_3d boolean not null default true,
  add column show_zodiac boolean not null default true,
  add column show_bio boolean not null default true;

create table public.card_access_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  show_dna boolean,          -- null = inherit global default
  show_play_score boolean,
  show_streak boolean,
  show_avatar_3d boolean,
  show_zodiac boolean,
  show_bio boolean,
  blocked boolean not null default false, -- hard block: viewer sees a "not available" stub
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, viewer_id)
);

alter table public.card_access_rules enable row level security;

create policy "owner can view own access rules"
  on public.card_access_rules for select
  using (auth.uid() = owner_id);

create policy "owner can upsert own access rules"
  on public.card_access_rules for insert
  with check (auth.uid() = owner_id);

create policy "owner can update own access rules"
  on public.card_access_rules for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "owner can delete own access rules"
  on public.card_access_rules for delete
  using (auth.uid() = owner_id);

-- A viewer needs to know if THEY are blocked/overridden, without seeing the
-- owner's full rule table for every other viewer.
create policy "viewer can see whether they are blocked"
  on public.card_access_rules for select
  using (auth.uid() = viewer_id);

create index idx_car_owner on public.card_access_rules (owner_id);
create index idx_car_viewer on public.card_access_rules (viewer_id);
