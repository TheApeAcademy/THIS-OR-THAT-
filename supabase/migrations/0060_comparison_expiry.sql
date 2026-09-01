-- Time-boxed polls: an optional deadline after which a comparison stops
-- accepting votes and drops out of active discovery (still viewable via its
-- own permalink for final results).
alter table public.comparisons add column expires_at timestamptz;
create index idx_comparisons_expires_at on public.comparisons (expires_at) where expires_at is not null;
