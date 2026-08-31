-- All five are trigger-only, never called directly — revoke Supabase's
-- auto-granted EXECUTE, in a separate migration so it actually sticks.
revoke execute on function public.handle_comparison_like_notify() from anon, authenticated;
revoke execute on function public.handle_card_like_notify() from anon, authenticated;
revoke execute on function public.handle_comment_notify() from anon, authenticated;
revoke execute on function public.handle_card_comment_notify() from anon, authenticated;
revoke execute on function public.handle_follow_notify() from anon, authenticated;
