-- Moderation layer: reporting, an admin flag, account suspension, and
-- content-length guards. Additive only — no existing policy is weakened.

-- ============================================================
-- admin flag + suspension on profiles
-- ============================================================
alter table public.profiles add column is_admin boolean not null default false;
alter table public.profiles add column suspended_at timestamptz;

-- ============================================================
-- reports
-- ============================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('comment', 'comparison', 'profile')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  details text check (details is null or char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id)
);

alter table public.reports enable row level security;

create policy "users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reporters can view own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "admins can view all reports"
  on public.reports for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins can update reports"
  on public.reports for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create index idx_reports_status on public.reports (status, created_at desc);
create index idx_reports_target on public.reports (target_type, target_id);

-- ============================================================
-- admin moderation powers (additive permissive policies — the existing
-- "own row" policies still apply for regular users)
-- ============================================================
create policy "admins can update any comparison"
  on public.comparisons for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins can update any comment"
  on public.comments for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins can update any profile"
  on public.profiles for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ============================================================
-- suspended accounts lose write access (restrictive: ANDed with the
-- existing permissive insert policies, so it can only narrow, never widen)
-- ============================================================
create policy "suspended users cannot vote"
  on public.votes as restrictive for insert
  with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.suspended_at is not null)
  );

create policy "suspended users cannot comment"
  on public.comments as restrictive for insert
  with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.suspended_at is not null)
  );

create policy "suspended users cannot create comparisons"
  on public.comparisons as restrictive for insert
  with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.suspended_at is not null)
  );

-- ============================================================
-- sane content-length guards (spam/abuse resistance)
-- ============================================================
alter table public.comparison_options
  add constraint comparison_options_label_length check (char_length(btrim(label)) between 1 and 60);

alter table public.comparisons
  add constraint comparisons_prompt_length check (prompt is null or char_length(prompt) <= 200);
