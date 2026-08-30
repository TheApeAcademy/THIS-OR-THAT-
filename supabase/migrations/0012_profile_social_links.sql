-- Lightweight Linktree-style social handles shown on the public share card.
-- Free-form jsonb keyed by platform so we don't need a migration per network;
-- validated shape at the app layer.
alter table public.profiles add column social_links jsonb not null default '{}'::jsonb;
