-- Lazy sweep for "a time-boxed poll just ended" instead of standing up
-- pg_cron/pg_net (neither is enabled on this project): a single
-- security-definer function finds comparisons whose deadline has passed
-- but haven't been notified yet, fires a notification to every voter, and
-- stamps them so it never double-notifies. Called opportunistically from
-- the Home feed's existing server-rendered load (0067) rather than on a
-- true schedule — fires within moments of real traffic, no new infra.
alter table public.comparisons add column final_result_notified_at timestamptz;

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'like_comparison', 'like_card', 'comment_comparison', 'comment_card',
    'reply_comment', 'follow', 'mention', 'card_view', 'debate_result',
    'duel_challenge_received', 'duel_challenge_accepted', 'duel_challenge_declined'
  ));

create function public.sweep_expired_comparisons()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comparison_id uuid;
begin
  for v_comparison_id in
    select c.id
    from public.comparisons c
    where c.expires_at is not null
      and c.expires_at <= now()
      and c.final_result_notified_at is null
    limit 50
  loop
    insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
    select distinct v.user_id, null, 'debate_result', 'comparison', v_comparison_id
    from public.votes v
    where v.comparison_id = v_comparison_id;

    update public.comparisons set final_result_notified_at = now() where id = v_comparison_id;
  end loop;
end;
$$;

-- Intentionally left callable by anon/authenticated (the default PUBLIC
-- execute grant) — it takes no arguments, touches no caller-specific data,
-- and is meant to be triggered opportunistically by any page load.
