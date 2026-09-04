-- Integration step (I2): resolve the vote-switch double-counting collision.
--
-- Main's handle_vote_switch() trigger (0062_allow_vote_switching.sql) and
-- this branch's change_vote() RPC both independently adjust
-- comparison_options.vote_count by -1/+1 on the same votes UPDATE. If both
-- ran, a single vote change would move counts by 2. Since change_vote()
-- itself performs the UPDATE from inside a security-definer function body,
-- main's AFTER UPDATE trigger would still fire even if callers were
-- switched to use change_vote() exclusively — the trigger has to be
-- dropped, not just bypassed.
--
-- change_vote() is kept as the one vote-switch mechanism because it does
-- more than main's trigger: it also re-checks the block relationship,
-- rate-limits repeated changes, moves the preference_signals win from the
-- old option's label to the new one, and writes an audit row to
-- vote_changes (the "N people changed their vote" / "what changed your
-- mind?" feature). lib/actions/vote.ts's voteAction is updated in the
-- frontend reconciliation pass to call this RPC instead of doing a raw
-- `update votes set option_id = ...`.
drop trigger on_vote_switched on public.votes;
drop function public.handle_vote_switch();

-- Main's "users can update own votes" policy (0062) has no restrictive
-- counterpart, so a client-side update currently bypasses the same
-- block/mute/rate-limit/deactivation checks that gate a new vote's INSERT.
-- Mirror those as restrictive UPDATE policies.
create policy "blocked users cannot switch a vote across a block"
  on public.votes as restrictive for update
  with check (
    not exists (
      select 1 from public.comparisons c
      where c.id = comparison_id
        and c.creator_id is not null
        and public.is_blocked(auth.uid(), c.creator_id)
    )
  );

create policy "deactivated users cannot switch a vote"
  on public.votes as restrictive for update
  with check (
    not exists (select 1 from public.profiles p where p.id = auth.uid() and p.deactivated_at is not null)
  );

create policy "rate limit switching a vote"
  on public.votes as restrictive for update
  with check (
    (
      select count(*) from public.vote_changes vc
      where vc.user_id = auth.uid() and vc.changed_at > now() - interval '1 hour'
    ) < 60
  );

-- ============================================================
-- change_vote() / set_last_vote_change_reason() / get_vote_change_count()
-- — deferred here from the engagement-core migration (I1) specifically so
-- they'd land in the same migration as the trigger removal they depend on.
-- ============================================================
create function public.change_vote(p_comparison_id uuid, p_option_id uuid, p_reason text default null)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing_option_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.comparison_options
    where id = p_option_id and comparison_id = p_comparison_id
  ) then
    raise exception 'Option does not belong to this comparison';
  end if;

  if exists (
    select 1 from public.comparisons c
    where c.id = p_comparison_id
      and c.creator_id is not null
      and public.is_blocked(v_user_id, c.creator_id)
  ) then
    raise exception 'Not allowed';
  end if;

  select option_id into v_existing_option_id
  from public.votes
  where user_id = v_user_id and comparison_id = p_comparison_id;

  -- No existing vote (a real race with the caller's own insert attempt) or
  -- re-picking the same option — nothing to change.
  if v_existing_option_id is null or v_existing_option_id = p_option_id then
    return;
  end if;

  if (
    select count(*) from public.vote_changes
    where user_id = v_user_id and changed_at > now() - interval '1 hour'
  ) >= 60 then
    raise exception 'Too many vote changes — try again later';
  end if;

  update public.votes
  set option_id = p_option_id
  where user_id = v_user_id and comparison_id = p_comparison_id;

  update public.comparison_options set vote_count = greatest(vote_count - 1, 0) where id = v_existing_option_id;
  update public.comparison_options set vote_count = vote_count + 1 where id = p_option_id;

  -- preference_signals opportunities were already counted once, at the
  -- original vote — only the win moves from the old option's label to the
  -- new one. Category-level preference_dna is unaffected since the vote
  -- stays within the same comparison/category.
  update public.preference_signals ps
  set wins = greatest(ps.wins - 1, 0), updated_at = now()
  from public.comparison_options co
  where co.id = v_existing_option_id
    and ps.user_id = v_user_id
    and ps.label_key = lower(btrim(co.label));

  update public.preference_signals ps
  set wins = ps.wins + 1, updated_at = now()
  from public.comparison_options co
  where co.id = p_option_id
    and ps.user_id = v_user_id
    and ps.label_key = lower(btrim(co.label));

  insert into public.vote_changes (user_id, comparison_id, from_option_id, to_option_id, reason)
  values (v_user_id, p_comparison_id, v_existing_option_id, p_option_id, nullif(btrim(p_reason), ''));
end;
$$;

-- Attaching an optional "what changed your mind?" reason after the fact
-- (the UI shows the prompt only once the change has already landed).
create function public.set_last_vote_change_reason(p_comparison_id uuid, p_reason text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  update public.vote_changes
  set reason = nullif(btrim(p_reason), '')
  where id = (
    select id from public.vote_changes
    where user_id = v_user_id and comparison_id = p_comparison_id
    order by changed_at desc
    limit 1
  );
end;
$$;

-- Public "N people changed their vote" count — votes/vote_changes have no
-- cross-user select policy, so this mirrors get_global_pulse's
-- security-definer aggregation pattern rather than exposing rows.
create function public.get_vote_change_count(p_comparison_id uuid)
returns int
language sql
stable
security definer set search_path = public
as $$
  select count(*)::int from public.vote_changes where comparison_id = p_comparison_id;
$$;
