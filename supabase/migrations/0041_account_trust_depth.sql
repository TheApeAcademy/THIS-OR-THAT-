-- Phase 9 — Account & trust depth: backup codes for Supabase Auth's native
-- TOTP MFA, WebAuthn passkey credentials, a login-history log, granular
-- discoverability controls, and a muted-words / sensitive-content filter.
--
-- 2FA itself uses Supabase Auth's built-in MFA (auth.mfa.enroll/challenge/
-- verify) — no schema needed for the TOTP factor itself, GoTrue owns that.
-- This migration only adds what GoTrue doesn't provide.

-- ============================================================
-- backup codes — GoTrue has no backup-code concept, so this is a real
-- custom build. Redemption (verify-backup-code edge function) can't
-- silently elevate the existing session to aal2 the way a real TOTP
-- verify does — there's no GoTrue API for that from a custom factor — so
-- a valid code instead deletes the caller's TOTP factor via the Admin
-- API, dropping the account back to password-only so they can sign in
-- and re-enroll. That's disclosed in Settings, not hidden.
-- ============================================================
create table public.mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.mfa_backup_codes enable row level security;

create policy "users can view own backup code metadata"
  on public.mfa_backup_codes for select
  using (auth.uid() = user_id);

create index idx_mfa_backup_codes_user on public.mfa_backup_codes (user_id);

-- ============================================================
-- passkeys (WebAuthn) — Supabase Auth has no native passkey support
-- either, so credentials are tracked here and the ceremonies run through
-- dedicated edge functions.
-- ============================================================
create table public.passkey_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  credential_id text unique not null,
  public_key text not null,
  counter bigint not null default 0,
  device_label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.passkey_credentials enable row level security;

create policy "users can view own passkeys"
  on public.passkey_credentials for select
  using (auth.uid() = user_id);

create policy "users can remove own passkeys"
  on public.passkey_credentials for delete
  using (auth.uid() = user_id);

create index idx_passkey_credentials_user on public.passkey_credentials (user_id);

-- Short-lived WebAuthn challenge storage — @simplewebauthn's verify step
-- needs the exact challenge it issued (anti-replay), and that can't be
-- trusted back from the client, so it's persisted server-side (edge
-- functions use the service-role key, bypassing RLS) keyed by user for
-- registration and by a random lookup id for authentication (no user is
-- known yet at that point — that's the whole point of passkey login).
-- No RLS-based client access is needed; only the service role touches
-- this table, and it's swept by deleting rows older than 5 minutes on
-- each write.
create table public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  challenge text not null,
  created_at timestamptz not null default now()
);

alter table public.webauthn_challenges enable row level security;

-- ============================================================
-- login history — an append-only log, not a live GoTrue session mirror
-- (the anon/authenticated context can't introspect GoTrue's real session
-- table). "Sign out of all other devices" uses the client's own
-- supabase.auth.signOut({ scope: 'others' }), a real supported call that
-- needs no server-side session bookkeeping here.
-- ============================================================
create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_label text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

alter table public.user_sessions enable row level security;

create policy "users can view own login history"
  on public.user_sessions for select
  using (auth.uid() = user_id);

create policy "users can log own sign-in"
  on public.user_sessions for insert
  with check (auth.uid() = user_id);

create index idx_user_sessions_user on public.user_sessions (user_id, created_at desc);

-- ============================================================
-- discoverability controls
-- ============================================================
alter table public.profiles
  add column discoverable_by_email boolean not null default true,
  add column discoverable_by_phone boolean not null default true,
  add column suggest_to_others boolean not null default true;

-- ============================================================
-- muted words + sensitive content
-- ============================================================
create table public.muted_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  phrase text not null,
  created_at timestamptz not null default now(),
  unique (user_id, phrase)
);

alter table public.muted_words enable row level security;

create policy "users can view own muted words"
  on public.muted_words for select
  using (auth.uid() = user_id);

create policy "users can add own muted word"
  on public.muted_words for insert
  with check (auth.uid() = user_id);

create policy "users can remove own muted word"
  on public.muted_words for delete
  using (auth.uid() = user_id);

alter table public.comparisons
  add column sensitive_content boolean not null default false;

alter table public.profiles
  add column hide_sensitive_content boolean not null default true;
