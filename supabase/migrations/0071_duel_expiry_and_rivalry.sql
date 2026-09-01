-- Duels never got an expires_at, so they never flowed through
-- sweep_expired_comparisons and never produced a stable, final result —
-- only a live/ephemeral verdict. Give every duel a fixed 48h clock so it
-- resolves the same way any other time-boxed comparison does, which is
-- what makes a win/loss "rivalry record" between two people meaningful.
create or replace function public.respond_to_duel_challenge(
  p_challenge_id uuid,
  p_accept boolean,
  p_option_label text default null,
  p_statement text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_challenge public.duel_challenges%rowtype;
  v_caller uuid := auth.uid();
  v_comparison_id uuid;
  v_label text;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_challenge from public.duel_challenges where id = p_challenge_id for update;
  if not found then
    raise exception 'Challenge not found';
  end if;
  if v_challenge.status <> 'pending' then
    raise exception 'This challenge has already been resolved.';
  end if;
  if v_challenge.challenger_id = v_caller then
    raise exception 'You can''t respond to your own challenge.';
  end if;
  if v_challenge.target_user_id is not null and v_challenge.target_user_id <> v_caller then
    raise exception 'This challenge isn''t addressed to you.';
  end if;

  if not p_accept then
    if v_challenge.target_user_id is null then
      raise exception 'Open challenges can''t be declined.';
    end if;
    update public.duel_challenges set status = 'declined', responded_at = now() where id = p_challenge_id;
    return null;
  end if;

  v_label := trim(coalesce(p_option_label, ''));
  if v_label = '' then
    raise exception 'Write your side of the debate first.';
  end if;
  if char_length(v_label) > 60 then
    raise exception 'Keep it under 60 characters.';
  end if;

  insert into public.comparisons (creator_id, category_id, prompt, expires_at)
  values (v_caller, v_challenge.category_id, v_challenge.prompt, now() + interval '48 hours')
  returning id into v_comparison_id;

  insert into public.comparison_options (comparison_id, side, label, claimed_by, statement)
  values
    (v_comparison_id, 'a', v_challenge.challenger_label, v_challenge.challenger_id, v_challenge.challenger_statement),
    (v_comparison_id, 'b', v_label, v_caller, nullif(trim(coalesce(p_statement, '')), ''));

  update public.duel_challenges
    set status = 'accepted', target_user_id = v_caller, comparison_id = v_comparison_id, responded_at = now()
    where id = p_challenge_id;

  return v_comparison_id;
end;
$$;

revoke all on function public.respond_to_duel_challenge(uuid, boolean, text, text) from public;
grant execute on function public.respond_to_duel_challenge(uuid, boolean, text, text) to authenticated;

-- Head-to-head win/loss/tie tally between two people across every duel
-- (resolved comparison with claimed_by set on both sides) they've had.
-- "Resolved" means the clock ran out (expires_at <= now()), the same
-- condition sweep_expired_comparisons uses to produce a final verdict —
-- this doesn't depend on the sweep having actually run yet, it just
-- compares vote counts directly, same as computeVerdict on the client.
create function public.get_duel_record(p_user_a uuid, p_user_b uuid)
returns table(wins_a int, wins_b int, ties int)
language sql
stable
security definer
set search_path = public
as $$
  with duel_options as (
    select oa.vote_count as votes_a, ob.vote_count as votes_b
    from public.comparison_options oa
    join public.comparison_options ob on ob.comparison_id = oa.comparison_id and ob.claimed_by = p_user_b
    join public.comparisons c on c.id = oa.comparison_id
    where oa.claimed_by = p_user_a
      and c.expires_at is not null
      and c.expires_at <= now()
  )
  select
    coalesce(count(*) filter (where votes_a > votes_b), 0)::int as wins_a,
    coalesce(count(*) filter (where votes_b > votes_a), 0)::int as wins_b,
    coalesce(count(*) filter (where votes_a = votes_b), 0)::int as ties
  from duel_options;
$$;

grant execute on function public.get_duel_record(uuid, uuid) to authenticated;
