-- record_play_answer is an RPC endpoint for authenticated users; anon never
-- needs it (and auth.uid() would be null for anon anyway).
revoke execute on function public.record_play_answer(uuid, text, boolean) from anon;
