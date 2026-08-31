-- Phase 1 of the full-body avatar plan: prove the "own it, equip it" loop
-- before any full-body art exists. Items are flat catalog rows with a
-- slot + stacking z_index (used once compositing lands in Phase 2); art
-- here is placeholder — real illustrated cutouts replace asset_url later
-- without a schema change.

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('headwear', 'top', 'bottom', 'shoes', 'accessory')),
  name text not null,
  asset_url text not null,
  z_index int not null default 0,
  price_cents int,
  drop_expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.wardrobe_items enable row level security;

create policy "wardrobe catalog is publicly readable"
  on public.wardrobe_items for select
  using (true);

create table public.user_wardrobe (
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.wardrobe_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  source text not null check (source in ('free', 'purchase')),
  primary key (user_id, item_id)
);

alter table public.user_wardrobe enable row level security;

create policy "users can see own wardrobe"
  on public.user_wardrobe for select
  using (auth.uid() = user_id);

create policy "users can claim a free item as self"
  on public.user_wardrobe for insert
  with check (
    auth.uid() = user_id
    and source = 'free'
    and exists (
      select 1 from public.wardrobe_items wi
      where wi.id = item_id and wi.price_cents is null
    )
  );

create table public.user_outfit (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('headwear', 'top', 'bottom', 'shoes', 'accessory')),
  item_id uuid references public.wardrobe_items(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.user_outfit enable row level security;

create policy "users can see own outfit"
  on public.user_outfit for select
  using (auth.uid() = user_id);

create policy "users can equip an owned item"
  on public.user_outfit for insert
  with check (
    auth.uid() = user_id
    and (
      item_id is null
      or exists (
        select 1 from public.user_wardrobe uw
        where uw.user_id = auth.uid() and uw.item_id = user_outfit.item_id
      )
    )
  );

create policy "users can change own outfit"
  on public.user_outfit for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      item_id is null
      or exists (
        select 1 from public.user_wardrobe uw
        where uw.user_id = auth.uid() and uw.item_id = user_outfit.item_id
      )
    )
  );

-- Placeholder starter catalog (~11 items) so the shelf UI is demoable
-- before real illustrated art exists. asset_url holds inline SVG data
-- URIs today, same pattern as profiles.avatar_url; swaps to a Storage
-- bucket URL once real art replaces these.
insert into public.wardrobe_items (slot, name, asset_url, z_index, price_cents, drop_expires_at) values
  ('headwear', 'Classic Cap', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%231e3a8a%22%2F%3E%3Cpath%20d%3D%22M14%2038c0-11%208-19%2018-19s18%208%2018%2019v3H14v-3Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3Crect%20x%3D%2212%22%20y%3D%2238%22%20width%3D%2240%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3C%2Fsvg%3E', 1, 150, null),
  ('headwear', 'Beanie', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23334155%22%2F%3E%3Cpath%20d%3D%22M32%2015c-11%200-19%208-19%2018v6h38v-6c0-10-8-18-19-18Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3Crect%20x%3D%2213%22%20y%3D%2237%22%20width%3D%2238%22%20height%3D%227%22%20rx%3D%223.5%22%20fill%3D%22%23fff%22%20opacity%3D%220.7%22%2F%3E%3C%2Fsvg%3E', 1, null, null),
  ('top', 'Crew Tee', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%2364748b%22%2F%3E%3Cpath%20d%3D%22M22%2016l10%204%2010-4%208%208-6%206-2-2v22H24V28l-2%202-6-6%208-8Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3C%2Fsvg%3E', 2, null, null),
  ('top', 'Camo Tank', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%234d7c0f%22%2F%3E%3Cpath%20d%3D%22M24%2016h16v6h6l4%2010-6%203-2-5v22H22V30l-2%205-6-3%204-10h6v-6Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3C%2Fsvg%3E', 2, 300, null),
  ('top', 'Zip Hoodie', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23111827%22%2F%3E%3Cpath%20d%3D%22M22%2016c3%204%206%205%2010%205s7-1%2010-5l7%207-5%205-2-2v25H22V26l-2%202-5-5%207-7Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2226%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E', 2, 400, null),
  ('top', 'Launch Week Hoodie', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23b45309%22%2F%3E%3Cpath%20d%3D%22M22%2016c3%204%206%205%2010%205s7-1%2010-5l7%207-5%205-2-2v25H22V26l-2%202-5-5%207-7Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3Ccircle%20cx%3D%2232%22%20cy%3D%2226%22%20r%3D%224%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E', 2, null, now() + interval '14 days'),
  ('bottom', 'Wide Denim', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%231d4ed8%22%2F%3E%3Cpath%20d%3D%22M20%2016h24l2%2032-9%201-1-18-4%2018h-4l-4-18-1%2018-9-1%202-32Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3C%2Fsvg%3E', 3, null, null),
  ('bottom', 'Cargo Joggers', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%2378716c%22%2F%3E%3Cpath%20d%3D%22M21%2016h22l1%2020-2%2012-8-1%201-16-6%200%201%2016-8%201-1-12%200-20Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3C%2Fsvg%3E', 3, 350, null),
  ('shoes', 'Retro Runners', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23dc2626%22%2F%3E%3Cpath%20d%3D%22M12%2040c0-4%203-6%207-6l6-8%2020%202c5%200%209%204%209%209v3c0%202-2%203-4%203H16c-2%200-4-1-4-3v0Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3C%2Fsvg%3E', 4, 150, null),
  ('shoes', 'High-Tops', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%230f172a%22%2F%3E%3Cpath%20d%3D%22M12%2042c0-5%203-8%208-8l4-9%2018%201c5%200%2010%204%2010%2010v3c0%202-2%203-4%203H16c-2%200-4-1-4-3v3Z%22%20fill%3D%22%23fff%22%20opacity%3D%220.92%22%2F%3E%3Crect%20x%3D%2220%22%20y%3D%2224%22%20width%3D%2210%22%20height%3D%226%22%20rx%3D%222%22%20fill%3D%22%23fff%22%20opacity%3D%220.6%22%2F%3E%3C%2Fsvg%3E', 4, 250, null),
  ('accessory', 'Round Shades', 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23000000%22%2F%3E%3Ccircle%20cx%3D%2222%22%20cy%3D%2230%22%20r%3D%229%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%224%22%20opacity%3D%220.92%22%2F%3E%3Ccircle%20cx%3D%2242%22%20cy%3D%2230%22%20r%3D%229%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%224%22%20opacity%3D%220.92%22%2F%3E%3Cline%20x1%3D%2231%22%20y1%3D%2228%22%20x2%3D%2233%22%20y2%3D%2228%22%20stroke%3D%22%23fff%22%20stroke-width%3D%224%22%20opacity%3D%220.92%22%2F%3E%3C%2Fsvg%3E', 5, null, null);
