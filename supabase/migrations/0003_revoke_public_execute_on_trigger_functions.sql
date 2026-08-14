-- Postgres grants EXECUTE to PUBLIC by default at function creation, which anon/authenticated
-- inherit regardless of direct-role revokes. Must revoke from PUBLIC itself.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_vote() from public;
revoke execute on function public.handle_comment_count() from public;
revoke execute on function public.handle_comment_like_change() from public;
revoke execute on function public.check_comment_matches_vote() from public;
