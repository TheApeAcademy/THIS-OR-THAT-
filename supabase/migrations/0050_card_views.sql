-- Card safety system, step 1: an append-only view log that (unlike every
-- other table in this schema) must tolerate anonymous viewers, since
-- /card/[slug] has no auth gate. owner_id is denormalized off cards.user_id
-- deliberately so the SELECT policy and both indexes below avoid a join —
-- this will be the highest-write-volume table in the schema.
create table public.card_views (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null, -- null = anonymous
  created_at timestamptz not null default now()
);

alter table public.card_views enable row level security;

-- First anon-insert policy in this schema — scoped as tightly as possible:
-- a viewer may only log a view as themselves or anonymously, never spoofing
-- another user's viewer_id.
create policy "anyone can log a card view"
  on public.card_views for insert
  with check (viewer_id is null or auth.uid() = viewer_id);

create policy "owner can read own card views"
  on public.card_views for select
  using (auth.uid() = owner_id);

create index idx_card_views_owner_created on public.card_views (owner_id, created_at desc);
create index idx_card_views_card_viewer_recent on public.card_views (card_id, viewer_id, created_at desc);

alter publication supabase_realtime add table public.card_views;
