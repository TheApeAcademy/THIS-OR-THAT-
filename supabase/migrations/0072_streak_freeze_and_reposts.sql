-- Streak freeze (Duolingo-style): missing exactly one day no longer resets
-- the streak to zero if the user has a freeze banked. A gap of 2+ days
-- always resets regardless of freezes — a freeze only covers one missed
-- day. Freezes are earned back (capped at 3) every 7-day milestone.
alter table public.profiles add column streak_freezes int not null default 1;

create or replace function public.bump_streak(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_last date;
  v_current int;
  v_longest int;
  v_freezes int;
begin
  if p_user_id <> auth.uid() then
    return;
  end if;

  select last_active_date, current_streak, longest_streak, streak_freezes
    into v_last, v_current, v_longest, v_freezes
    from public.profiles where id = p_user_id;

  if v_last = current_date then
    return;
  elsif v_last = current_date - 1 then
    v_current := v_current + 1;
  elsif v_last = current_date - 2 and v_freezes > 0 then
    v_current := v_current + 1;
    v_freezes := v_freezes - 1;
  else
    v_current := 1;
  end if;

  v_longest := greatest(v_longest, v_current);

  if v_current > 0 and v_current % 7 = 0 then
    v_freezes := least(3, v_freezes + 1);
  end if;

  update public.profiles
    set current_streak = v_current, longest_streak = v_longest, last_active_date = current_date, streak_freezes = v_freezes
    where id = p_user_id;
end;
$$;

-- Repost: TikTok-style, folded into the existing Share sheet rather than a
-- new action-rail button. A repost is a like-shaped join row (who reposted
-- what, when) with a trigger-maintained counter, following the exact
-- comparison_likes/card_likes pattern already used throughout.
alter table public.comparisons add column repost_count int not null default 0;

create table public.comparison_reposts (
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comparison_id, user_id)
);

alter table public.comparison_reposts enable row level security;

create policy "reposts are publicly readable"
  on public.comparison_reposts for select
  using (true);

create policy "users can repost as self"
  on public.comparison_reposts for insert
  with check (auth.uid() = user_id);

create policy "users can undo own repost"
  on public.comparison_reposts for delete
  using (auth.uid() = user_id);

create function public.handle_repost_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comparisons set repost_count = repost_count + 1 where id = new.comparison_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comparisons set repost_count = greatest(repost_count - 1, 0) where id = old.comparison_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_repost_change
  after insert or delete on public.comparison_reposts
  for each row execute function public.handle_repost_change();

create index idx_comparison_reposts_comparison on public.comparison_reposts (comparison_id);
create index idx_comparison_reposts_user on public.comparison_reposts (user_id, created_at desc);

-- Surfaces recent reposts from people the viewer follows, for splicing
-- into the Home feed with "reposted by @username" attribution — one row
-- per comparison (the most recent reposting follow), newest first.
create function public.get_recent_reposts_from_followed(p_user_id uuid, p_limit int default 20)
returns table(comparison_id uuid, reposted_at timestamptz, reposter_username text)
language sql
stable
security definer
set search_path = public
as $$
  select comparison_id, reposted_at, reposter_username
  from (
    select distinct on (r.comparison_id)
      r.comparison_id, r.created_at as reposted_at, p.username as reposter_username
    from public.comparison_reposts r
    join public.follows f on f.followee_id = r.user_id and f.follower_id = p_user_id
    join public.profiles p on p.id = r.user_id
    join public.comparisons c on c.id = r.comparison_id and c.status = 'active'
    order by r.comparison_id, r.created_at desc
  ) dedup
  order by reposted_at desc
  limit p_limit;
$$;

grant execute on function public.get_recent_reposts_from_followed(uuid, int) to authenticated;
