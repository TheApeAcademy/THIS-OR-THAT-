-- Per-user notification muting. Rows are still written by the existing
-- security-definer triggers (unchanged - keeps this additive and low risk),
-- muting just filters what's shown/counted for a muted type, the same way
-- most apps implement "turn off this kind of notification."
alter table public.profiles
  add column muted_notification_types text[] not null default '{}';
