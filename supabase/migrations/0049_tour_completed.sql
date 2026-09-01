-- Tracks whether a user has been shown the post-onboarding coach-mark tour,
-- mirroring the onboarding_completed_at / avatar_upgrade_prompt_dismissed_at
-- "one-time prompt" convention exactly.
alter table public.profiles
  add column tour_completed_at timestamptz;
