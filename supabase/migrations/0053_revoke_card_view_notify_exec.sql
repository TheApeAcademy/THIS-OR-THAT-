-- Matches 0037/0040's revoke-after-create pattern: the trigger function can
-- only ever fire via the card_views insert trigger, never be called directly.
revoke execute on function public.handle_card_view_notify from anon, authenticated;
