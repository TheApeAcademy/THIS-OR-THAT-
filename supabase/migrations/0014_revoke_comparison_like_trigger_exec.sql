-- Supabase auto-grants EXECUTE to anon/authenticated on new functions via a
-- post-creation event trigger that fires after 0013's own revoke would have,
-- so (per the pattern in 0002/0003/0005/0006) the revoke has to land in its
-- own follow-up migration to actually stick.
revoke execute on function public.handle_comparison_like_change() from anon, authenticated;
