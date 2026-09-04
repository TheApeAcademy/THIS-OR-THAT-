-- Phase 15 — Craft & infra: feature flags / rollout infrastructure.
--
-- Everything readable (the app needs to evaluate a flag for every visitor,
-- including anonymous ones, before deciding what to render) but only
-- admins can define or change one — same is_admin gate used throughout
-- the admin migrations.
create table public.feature_flags (
  key text primary key,
  enabled_pct smallint not null default 0 check (enabled_pct between 0 and 100),
  enabled_for uuid[] not null default '{}',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

create policy "feature flags are publicly readable"
  on public.feature_flags for select
  using (true);

create policy "admins manage feature flags"
  on public.feature_flags for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create function public.handle_feature_flag_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger feature_flags_set_updated_at
  before update on public.feature_flags
  for each row execute function public.handle_feature_flag_updated_at();

revoke execute on function public.handle_feature_flag_updated_at() from anon, authenticated;

-- Seed the two rollout-worthy features shipped in Phases 8-14, both fully
-- on by default — matching the "full builds, not gated betas" instruction
-- these were built under. They exist here so a later rollback is a single
-- row update instead of a redeploy.
insert into public.feature_flags (key, enabled_pct, description) values
  ('ranked_choice_voting', 100, 'Instant-runoff ranked-choice post type in Create.'),
  ('live_realtime_counters', 100, 'Live vote/comment counters via Supabase Realtime on the comparison detail page.');
