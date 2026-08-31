-- CREATE OR REPLACE re-fires Supabase's post-creation grant hook the same
-- way CREATE does — revoke again defensively.
revoke execute on function public.handle_comment_notify() from anon, authenticated;
revoke execute on function public.handle_card_comment_notify() from anon, authenticated;
