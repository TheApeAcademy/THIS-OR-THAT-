-- Phase 2 of the avatar plan: swap the flat Dicebear SVG builder for a
-- real 3D avatar (Ready Player Me now; kept renderer-agnostic so a future
-- custom modular pipeline can replace RPM without another migration).
-- profiles.avatar_url keeps its existing meaning/consumers -- it now holds
-- a 2D PNG snapshot URL rendered from the 3D model instead of an SVG data
-- URI, but every reader (components/ui/Avatar.tsx, opengraph-image, etc.)
-- already treats avatar_url as "a data: URI or an https URL", so nothing
-- downstream needs to change.

alter table public.profiles
  add column avatar_model_url text,
  add column avatar_renderer text,
  add column avatar_meta jsonb not null default '{}'::jsonb,
  add column avatar_upgraded_at timestamptz,
  add column avatar_upgrade_prompt_dismissed_at timestamptz;

comment on column public.profiles.avatar_model_url is
  'Renderer-agnostic URL to the 3D avatar asset (currently always a Ready Player Me .glb export). Null until the user completes the 3D avatar builder.';
comment on column public.profiles.avatar_renderer is
  'Which system produced avatar_model_url, e.g. ''readyplayerme''. Deliberately free text, not a CHECK constraint, so a future custom pipeline needs no migration.';
comment on column public.profiles.avatar_meta is
  'Small renderer-specific metadata blob, e.g. {"rpmAvatarId": "...", "exportedAt": "..."}. Shape is renderer-defined and intentionally versionless.';
comment on column public.profiles.avatar_upgraded_at is
  'Set the first time a user completes the 3D avatar builder. Drives whether the one-time "upgrade to 3D" prompt is shown.';
comment on column public.profiles.avatar_upgrade_prompt_dismissed_at is
  'Set when a legacy (2D) user dismisses the 3D upgrade prompt without upgrading, so it is not shown again.';

-- No RLS policy changes: "profiles are publicly readable" and "users can
-- update own profile" (0001_init_schema.sql) are row-scoped and already
-- cover these new columns.
