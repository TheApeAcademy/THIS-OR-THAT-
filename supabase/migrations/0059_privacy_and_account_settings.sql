-- Backs two new Settings sections: Privacy (require a follow before a
-- stranger can view your card) and Account (a soft delete request — actual
-- removal is a manual/admin follow-up, not an irreversible client-triggered
-- delete).
alter table public.profiles
  add column card_requires_follow boolean not null default false,
  add column deletion_requested_at timestamptz;
