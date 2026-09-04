-- Phase 7: monetization (Flutterwave-backed Pro + wardrobe purchases),
-- card view analytics, sponsored comparisons, and Global Pulse.

-- ============================================================
-- entitlements
-- ============================================================
alter table public.profiles add column is_pro boolean not null default false;
alter table public.profiles add column pro_expires_at timestamptz;

-- ============================================================
-- payments — an audit log the webhook writes to, and the mechanism that
-- makes it idempotent against webhook retries (Flutterwave, like most
-- payment processors, may deliver the same event more than once).
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('pro', 'wardrobe_item')),
  reference text not null unique,
  wardrobe_item_id uuid references public.wardrobe_items(id),
  amount_cents int not null,
  currency text not null,
  status text not null default 'completed' check (status in ('completed', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- No insert/update policy — only the flutterwave-webhook edge function
-- (service role) writes here.

-- ============================================================
-- sponsored comparisons — admin-settable only, no self-serve ad platform.
-- The existing "admins can update any comparison" policy from
-- 0009_moderation.sql already covers these new columns (no column-level
-- restriction on that policy), so no new RLS policy is needed here.
-- ============================================================
alter table public.comparisons add column is_sponsored boolean not null default false;
alter table public.comparisons add column sponsor_label text;

-- ============================================================
-- card view analytics — an aggregate counter only, no visitor identity
-- persisted (doc's explicit privacy warning against "John viewed your
-- card at 3:41pm"-style tracking).
-- ============================================================
alter table public.cards add column view_count int not null default 0;

create function public.increment_card_view(p_card_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.cards set view_count = view_count + 1 where id = p_card_id;
$$;

grant execute on function public.increment_card_view(uuid) to authenticated, anon;

-- ============================================================
-- Global Pulse — per-country vote breakdown. votes has no public SELECT
-- policy (a user can only ever read their own vote rows), so this has to
-- be a security-definer aggregate rather than a client-side join; it
-- never returns anything below a 3-voter threshold per country, so a
-- single voter's country can't be singled out from the result.
-- ============================================================
create function public.get_global_pulse(p_comparison_id uuid)
returns table(country text, option_id uuid, votes bigint)
language sql
stable
security definer set search_path = public
as $$
  select p.country, v.option_id, count(*) as votes
  from public.votes v
  join public.profiles p on p.id = v.user_id
  where v.comparison_id = p_comparison_id and p.country is not null
  group by p.country, v.option_id
  having count(*) >= 3
  order by count(*) desc;
$$;

grant execute on function public.get_global_pulse(uuid) to authenticated, anon;
