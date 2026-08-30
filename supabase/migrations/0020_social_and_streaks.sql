-- Follow system, daily streaks, and a per-profile settings toggle for
-- whether the Play score shows on the public Share Card.
alter table public.profiles add column current_streak int not null default 0;
alter table public.profiles add column longest_streak int not null default 0;
alter table public.profiles add column last_active_date date;
alter table public.profiles add column show_play_score boolean not null default true;
alter table public.profiles add column follower_count int not null default 0;
alter table public.profiles add column following_count int not null default 0;

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self_follow check (follower_id <> followee_id)
);

alter table public.follows enable row level security;

create policy "follows are publicly readable"
  on public.follows for select
  using (true);

create policy "users can follow as self"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "users can unfollow own follow"
  on public.follows for delete
  using (auth.uid() = follower_id);

create function public.handle_follow_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count = follower_count + 1 where id = new.followee_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.followee_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute function public.handle_follow_change();

create index idx_follows_follower on public.follows (follower_id);
create index idx_follows_followee on public.follows (followee_id);

-- Daily streak bump: called once per day, per user, the first time they vote.
create function public.bump_streak(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_last date;
  v_current int;
  v_longest int;
begin
  if p_user_id <> auth.uid() then
    return;
  end if;

  select last_active_date, current_streak, longest_streak
    into v_last, v_current, v_longest
    from public.profiles where id = p_user_id;

  if v_last is null or v_last < current_date - 1 then
    v_current := 1;
  elsif v_last = current_date - 1 then
    v_current := v_current + 1;
  else
    return;
  end if;

  v_longest := greatest(v_longest, v_current);

  update public.profiles
    set current_streak = v_current, longest_streak = v_longest, last_active_date = current_date
    where id = p_user_id;
end;
$$;
