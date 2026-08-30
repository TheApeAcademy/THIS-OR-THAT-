-- Lightweight, DB-enforced anti-spam: caps that a legitimate user will
-- never hit, but that stop a runaway script or bot account. Restrictive
-- policies AND with the existing permissive insert policies, so this can
-- only narrow access, never widen it.
create policy "rate limit comparison creation"
  on public.comparisons as restrictive for insert
  with check (
    (
      select count(*) from public.comparisons c
      where c.creator_id = auth.uid() and c.created_at > now() - interval '1 day'
    ) < 30
  );

create policy "rate limit comment posting"
  on public.comments as restrictive for insert
  with check (
    (
      select count(*) from public.comments cm
      where cm.user_id = auth.uid() and cm.created_at > now() - interval '1 hour'
    ) < 40
  );
