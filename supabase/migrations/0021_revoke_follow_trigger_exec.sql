-- handle_follow_change is trigger-only, never called directly — revoke.
-- bump_streak IS meant to be called directly by authenticated users (an RPC
-- endpoint), so only anon (never logged in, auth.uid() would be null anyway)
-- loses access; authenticated keeps EXECUTE.
revoke execute on function public.handle_follow_change() from anon, authenticated;
revoke execute on function public.bump_streak(uuid) from anon;
