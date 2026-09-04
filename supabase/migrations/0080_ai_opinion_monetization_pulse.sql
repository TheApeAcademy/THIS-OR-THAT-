-- Integration step (I1, safe layer): AI opinion cache column, Flutterwave
-- monetization (Pro entitlement + payments audit log), sponsored
-- comparisons, and Global Pulse.
--
-- This deliberately DOES NOT include the branch's cards.view_count /
-- increment_card_view() — main already built a more complete card-view
-- system (a real card_views append-log plus card_access_rules for
-- per-person privacy, 0050-0053) that this would have been a redundant,
-- less-capable duplicate of. Dropped per the I4 card-view reconciliation
-- rather than carried over; Phase 7's "views this month" UI gets repointed
-- at main's system instead.

-- ============================================================
-- AI opinion cache (also doubles as the "biggest reasons behind each
-- side" comment-theme summary).
-- ============================================================
alter table public.comparisons add column ai_opinion text;
alter table public.comparisons add column ai_opinion_generated_at timestamptz;

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
-- 0009_moderation.sql already covers these new columns.
-- ============================================================
alter table public.comparisons add column is_sponsored boolean not null default false;
alter table public.comparisons add column sponsor_label text;

-- ============================================================
-- Global Pulse — per-country vote breakdown. votes has no public SELECT
-- policy, so this has to be a security-definer aggregate; it never
-- returns anything below a 3-voter threshold per country, so a single
-- voter's country can't be singled out from the result.
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
