-- 0062 revoked execute from anon/authenticated but missed the PUBLIC
-- pseudo-role grant every function gets by default on creation — anon and
-- authenticated inherit EXECUTE through PUBLIC regardless, so the earlier
-- revoke was a no-op. Matches the exact fix already applied for
-- handle_deleted_vote in 0006.
revoke execute on function public.handle_vote_switch() from public, anon, authenticated;
