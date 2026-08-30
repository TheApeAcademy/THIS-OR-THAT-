-- Supabase auto-grants EXECUTE on newly created functions to anon/authenticated
-- via a post-creation event trigger that fires after 0016's own statements —
-- revoke it here in a separate migration so the revoke actually sticks.
revoke execute on function public.handle_card_like_change() from anon, authenticated;
revoke execute on function public.handle_card_comment_count() from anon, authenticated;
