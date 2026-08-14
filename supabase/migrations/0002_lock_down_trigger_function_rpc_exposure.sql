-- Trigger functions should only run inside their triggers, never be callable
-- directly as a PostgREST RPC endpoint. compare_users is the sole intentional
-- public RPC and is left untouched.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_new_vote() from anon, authenticated;
revoke execute on function public.handle_comment_count() from anon, authenticated;
revoke execute on function public.handle_comment_like_change() from anon, authenticated;
revoke execute on function public.check_comment_matches_vote() from anon, authenticated;
