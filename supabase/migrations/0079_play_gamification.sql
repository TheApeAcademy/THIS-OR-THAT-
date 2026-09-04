-- Integration step (I1, safe layer): reputation, achievements, a
-- prediction mode ("what did most people pick?"), and a play streak that
-- survives a refresh instead of living in client state.
--
-- Every function this migration replaces (handle_new_vote,
-- handle_comment_count, handle_comment_like_change, record_play_answer)
-- has its base definition in the shared 0001 schema, untouched by any of
-- main's own migrations since — verified by grep across main's full
-- migration history before writing this. Each override here is strictly
-- additive (reputation bumps, achievement inserts) on top of that shared
-- base, nothing is dropped.
--
-- bump_streak and get_leaderboard are deliberately NOT included — both
-- were independently redefined by main's own migrations (streak-freeze
-- consumption; profile_photo_url + is_seed_account filtering) and need a
-- real hand-merge, done as their own dedicated migration once every
-- branch change touching them is collected.

-- ============================================================
-- reputation: a small, auditable point total, not an ML score.
-- ============================================================
alter table public.profiles add column reputation int not null default 0;
alter table public.profiles add column play_streak int not null default 0;
alter table public.profiles add column play_best_streak int not null default 0;

create function public.bump_play_streak(p_user_id uuid, p_correct boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_current int;
  v_best int;
begin
  if p_correct is true then
    select play_streak, play_best_streak into v_current, v_best from public.profiles where id = p_user_id;
    v_current := coalesce(v_current, 0) + 1;
    v_best := greatest(coalesce(v_best, 0), v_current);
    update public.profiles set play_streak = v_current, play_best_streak = v_best where id = p_user_id;
  elsif p_correct is false then
    update public.profiles set play_streak = 0 where id = p_user_id;
  end if;
end;
$$;

revoke execute on function public.bump_play_streak(uuid, boolean) from anon, authenticated;

-- ============================================================
-- achievements
-- ============================================================
create table public.achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'first_vote', 'first_comment', 'first_comparison', 'streak_3', 'streak_7', 'trivia_master'
  )),
  earned_at timestamptz not null default now(),
  primary key (user_id, type)
);

alter table public.achievements enable row level security;

create policy "achievements are publicly readable"
  on public.achievements for select
  using (true);

-- No insert policy: only the security-definer trigger functions below
-- award achievements — never a direct client insert.

-- ============================================================
-- votes: +1 reputation, first-vote achievement, on top of the shared
-- vote-count + preference-DNA maintenance from 0001.
-- ============================================================
create or replace function public.handle_new_vote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_category_id uuid;
  v_category_slug text;
  v_cat_votes int;
  v_total_user_votes int;
  v_cat_pct numeric;
begin
  update public.comparison_options set vote_count = vote_count + 1 where id = new.option_id;
  update public.comparisons set vote_count = vote_count + 1 where id = new.comparison_id;
  update public.profiles set reputation = reputation + 1 where id = new.user_id;

  select category_id into v_category_id from public.comparisons where id = new.comparison_id;

  if v_category_id is not null then
    select slug into v_category_slug from public.categories where id = v_category_id;

    select count(*) into v_total_user_votes
    from public.votes
    where user_id = new.user_id;

    select count(*) into v_cat_votes
    from public.votes v
    join public.comparisons c on c.id = v.comparison_id
    where v.user_id = new.user_id and c.category_id = v_category_id;

    v_cat_pct := case when v_total_user_votes > 0
      then round((v_cat_votes::numeric / v_total_user_votes) * 100, 1)
      else 0
    end;

    insert into public.preference_dna (user_id, breakdown, updated_at)
    values (
      new.user_id,
      jsonb_build_object(v_category_slug, jsonb_build_object('votes', v_cat_votes, 'pct', v_cat_pct)),
      now()
    )
    on conflict (user_id) do update
    set breakdown = jsonb_set(
          coalesce(public.preference_dna.breakdown, '{}'::jsonb),
          array[v_category_slug],
          jsonb_build_object('votes', v_cat_votes, 'pct', v_cat_pct),
          true
        ),
        updated_at = now();
  end if;

  if (select count(*) from public.votes where user_id = new.user_id) = 1 then
    insert into public.achievements (user_id, type) values (new.user_id, 'first_vote')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

-- ============================================================
-- comments: +1 reputation to the commenter, first-comment achievement.
-- comment likes: +1 reputation to the comment's author.
-- ============================================================
create or replace function public.handle_comment_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comparisons set comment_count = comment_count + 1 where id = new.comparison_id;
    update public.profiles set reputation = reputation + 1 where id = new.user_id;

    if (select count(*) from public.comments where user_id = new.user_id) = 1 then
      insert into public.achievements (user_id, type) values (new.user_id, 'first_comment')
      on conflict do nothing;
    end if;
  elsif tg_op = 'DELETE' then
    update public.comparisons set comment_count = greatest(comment_count - 1, 0) where id = old.comparison_id;
  end if;
  return null;
end;
$$;

create or replace function public.handle_comment_like_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_comment_author uuid;
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1 where id = new.comment_id;
    select user_id into v_comment_author from public.comments where id = new.comment_id;
    if v_comment_author is not null then
      update public.profiles set reputation = reputation + 1 where id = v_comment_author;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comments set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

-- ============================================================
-- comparisons: +2 reputation to the creator, first-comparison achievement.
-- A genuinely new trigger — main has no equivalent, so this simply adds
-- another AFTER INSERT trigger alongside whatever else already fires on
-- public.comparisons.
-- ============================================================
create function public.handle_comparison_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.creator_id is not null then
    update public.profiles set reputation = reputation + 2 where id = new.creator_id;

    if (select count(*) from public.comparisons where creator_id = new.creator_id) = 1 then
      insert into public.achievements (user_id, type) values (new.creator_id, 'first_comparison')
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_comparison_created
  after insert on public.comparisons
  for each row execute function public.handle_comparison_created();

revoke execute on function public.handle_comparison_created() from anon, authenticated;

-- ============================================================
-- trivia: reputation for correct answers, persistent play streak,
-- trivia_master achievement at 10 cumulative correct answers. Still calls
-- bump_streak() at the end exactly like the shared 0023 base version did —
-- that call resolves against whatever bump_streak is currently defined as
-- at runtime, so it keeps working once I3's merged bump_streak lands.
-- ============================================================
create or replace function public.record_play_answer(
  p_comparison_id uuid,
  p_subject text,
  p_correct boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_correct int;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.play_answers (user_id, comparison_id, subject, correct)
  values (v_user_id, p_comparison_id, p_subject, p_correct);

  if p_correct is not null then
    insert into public.play_stats (user_id, subject, correct, total)
    values (v_user_id, p_subject, case when p_correct then 1 else 0 end, 1)
    on conflict (user_id, subject)
    do update set
      correct = public.play_stats.correct + case when p_correct then 1 else 0 end,
      total = public.play_stats.total + 1,
      updated_at = now();

    if p_correct then
      update public.profiles set reputation = reputation + 3 where id = v_user_id;
    end if;

    perform public.bump_play_streak(v_user_id, p_correct);

    select coalesce(sum(correct), 0) into v_total_correct from public.play_stats where user_id = v_user_id;
    if v_total_correct >= 10 then
      insert into public.achievements (user_id, type) values (v_user_id, 'trivia_master') on conflict do nothing;
    end if;
  end if;

  perform public.bump_streak(v_user_id);
end;
$$;

-- ============================================================
-- predictions: "what did most people pick?" — guessed against the
-- option's vote count at the moment of the guess.
-- ============================================================
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  predicted_option_id uuid not null references public.comparison_options(id) on delete cascade,
  correct boolean,
  created_at timestamptz not null default now(),
  unique (user_id, comparison_id)
);

alter table public.predictions enable row level security;

create policy "users can view own predictions"
  on public.predictions for select
  using (auth.uid() = user_id);

create index idx_predictions_user on public.predictions (user_id);

create function public.record_prediction(p_comparison_id uuid, p_predicted_option_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_leader_option_id uuid;
  v_correct boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.comparison_options
    where id = p_predicted_option_id and comparison_id = p_comparison_id
  ) then
    raise exception 'That option does not belong to this comparison';
  end if;

  select id into v_leader_option_id
  from public.comparison_options
  where comparison_id = p_comparison_id
  order by vote_count desc
  limit 1;

  v_correct := v_leader_option_id is not null and v_leader_option_id = p_predicted_option_id;

  insert into public.predictions (user_id, comparison_id, predicted_option_id, correct)
  values (v_user_id, p_comparison_id, p_predicted_option_id, v_correct)
  on conflict (user_id, comparison_id) do update
  set predicted_option_id = excluded.predicted_option_id, correct = excluded.correct;

  perform public.bump_play_streak(v_user_id, v_correct);

  return v_correct;
end;
$$;
