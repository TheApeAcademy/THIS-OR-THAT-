-- Basic external-share attribution: which platform's share button actually
-- drove a visitor to a comparison's public link. Insert-only from the
-- public /d/[id] route (anon visitors included, no auth required to log
-- one); reads are admin-only. Deliberately minimal - answers "which
-- platform is driving traffic," not a full analytics product.
create table link_visits (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  source text,
  created_at timestamptz not null default now()
);

create index idx_link_visits_comparison_id on link_visits(comparison_id);

alter table link_visits enable row level security;

create policy "anyone can log a link visit"
  on link_visits for insert
  to public
  with check (true);

create policy "admins can read link visits"
  on link_visits for select
  to public
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
