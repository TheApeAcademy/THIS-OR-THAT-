-- Birthdate for zodiac sign display on the TOT card. No time-of-day meaning,
-- so `date` not `timestamptz`. The zodiac sign itself is never stored — it's
-- derived at render time by lib/zodiac.ts, same "derive, don't duplicate"
-- pattern as lib/archetype.ts deriving a personality label from DNA data.
alter table public.profiles
  add column birthdate date;
