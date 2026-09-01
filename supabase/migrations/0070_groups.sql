-- Groups (fan clubs): real membership + a wall people can post/reply on,
-- plus a light "rivalry" record — a group-tagged debate option rolling up
-- into the group's win/loss count once its comparison resolves. Reuses
-- the exact card_likes/card_comments-style counter-trigger pattern
-- already established elsewhere in this schema.
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 60),
  description text check (description is null or char_length(description) <= 300),
  avatar_url text,
  member_count int not null default 0,
  debate_wins int not null default 0,
  debate_losses int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create policy "groups are publicly readable"
  on public.groups for select using (true);

create policy "users can create a group"
  on public.groups for insert with check (created_by = auth.uid());

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "group membership is publicly readable"
  on public.group_members for select using (true);

create policy "users can join a group as self"
  on public.group_members for insert with check (user_id = auth.uid());

create policy "users can leave a group"
  on public.group_members for delete using (user_id = auth.uid());

create function public.handle_group_member_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.groups set member_count = member_count + 1 where id = new.group_id;
  elsif TG_OP = 'DELETE' then
    update public.groups set member_count = greatest(member_count - 1, 0) where id = old.group_id;
  end if;
  return null;
end;
$$;

create trigger on_group_member_change
  after insert or delete on public.group_members
  for each row execute function public.handle_group_member_change();

-- Auto-join a group's creator (member_count above already accounts for it).
create function public.handle_group_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.group_members (group_id, user_id) values (new.id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_group_created();

create table public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  like_count int not null default 0,
  comment_count int not null default 0,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now()
);

alter table public.group_posts enable row level security;

create policy "active group posts are publicly readable"
  on public.group_posts for select using (status = 'active');

create policy "members can post to their group"
  on public.group_posts for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.group_members m where m.group_id = group_posts.group_id and m.user_id = auth.uid())
  );

create policy "users can update own group posts"
  on public.group_posts for update using (user_id = auth.uid());

create policy "users can delete own group posts"
  on public.group_posts for delete using (user_id = auth.uid());

create index idx_group_posts_group on public.group_posts (group_id, created_at desc);

create table public.group_post_likes (
  post_id uuid not null references public.group_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.group_post_likes enable row level security;

create policy "group post likes are publicly readable"
  on public.group_post_likes for select using (true);

create policy "users can like a group post as self"
  on public.group_post_likes for insert with check (auth.uid() = user_id);

create policy "users can unlike own group post like"
  on public.group_post_likes for delete using (auth.uid() = user_id);

create function public.handle_group_post_like_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.group_posts set like_count = like_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.group_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger on_group_post_like_change
  after insert or delete on public.group_post_likes
  for each row execute function public.handle_group_post_like_change();

create table public.group_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.group_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.group_post_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now()
);

alter table public.group_post_comments enable row level security;

create policy "active group post comments are publicly readable"
  on public.group_post_comments for select using (status = 'active');

create policy "users can comment on a group post as self"
  on public.group_post_comments for insert with check (auth.uid() = user_id);

create policy "users can update own group post comments"
  on public.group_post_comments for update using (auth.uid() = user_id);

create policy "users can delete own group post comments"
  on public.group_post_comments for delete using (auth.uid() = user_id);

create function public.handle_group_post_comment_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update public.group_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update public.group_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger on_group_post_comment_count
  after insert or delete on public.group_post_comments
  for each row execute function public.handle_group_post_comment_count();

create index idx_group_post_comments_post on public.group_post_comments (post_id, created_at asc);

-- Group-tagged debates: an option can represent a group, so a comparison
-- can be a "Wizkid FC vs 30BG"-style battle.
alter table public.comparison_options add column group_id uuid references public.groups(id);

-- Extend the Track-1 sweep to also roll up group win/loss once a
-- group-tagged option's comparison resolves.
create or replace function public.sweep_expired_comparisons()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comparison_id uuid;
  v_max_votes int;
  v_option record;
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

    select max(o.vote_count) into v_max_votes
    from public.comparison_options o
    where o.comparison_id = v_comparison_id;

    if v_max_votes is not null and v_max_votes > 0 then
      for v_option in
        select o.group_id, (o.vote_count = v_max_votes) as is_winner
        from public.comparison_options o
        where o.comparison_id = v_comparison_id and o.group_id is not null
      loop
        if v_option.is_winner then
          update public.groups set debate_wins = debate_wins + 1 where id = v_option.group_id;
        else
          update public.groups set debate_losses = debate_losses + 1 where id = v_option.group_id;
        end if;
      end loop;
    end if;

    update public.comparisons set final_result_notified_at = now() where id = v_comparison_id;
  end loop;
end;
$$;
