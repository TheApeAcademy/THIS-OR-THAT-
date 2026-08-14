-- This or That — V1 schema
-- Tables, RLS policies, and triggers for the core voting/comment/identity loop.

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- categories (admin-curated, seeded below)
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  emoji text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

alter table public.categories enable row level security;

create policy "active categories are publicly readable"
  on public.categories for select
  using (is_active = true);

-- ============================================================
-- comparisons + comparison_options
-- ============================================================
create table public.comparisons (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id),
  prompt text,
  is_onboarding boolean not null default false,
  status text not null default 'active' check (status in ('active', 'hidden', 'removed')),
  vote_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.comparisons enable row level security;

create policy "active comparisons are publicly readable"
  on public.comparisons for select
  using (status = 'active' or creator_id = auth.uid());

create policy "users can create comparisons"
  on public.comparisons for insert
  with check (auth.uid() = creator_id);

create policy "creators can update own comparisons"
  on public.comparisons for update
  using (auth.uid() = creator_id);

create policy "creators can delete own comparisons"
  on public.comparisons for delete
  using (auth.uid() = creator_id);

create table public.comparison_options (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  side text not null check (side in ('a', 'b')),
  label text not null,
  image_url text,
  vote_count int not null default 0,
  unique (comparison_id, side)
);

alter table public.comparison_options enable row level security;

create policy "options readable when comparison readable"
  on public.comparison_options for select
  using (
    exists (
      select 1 from public.comparisons c
      where c.id = comparison_id
        and (c.status = 'active' or c.creator_id = auth.uid())
    )
  );

create policy "creators can insert options for own comparison"
  on public.comparison_options for insert
  with check (
    exists (
      select 1 from public.comparisons c
      where c.id = comparison_id and c.creator_id = auth.uid()
    )
  );

create index idx_comparisons_feed on public.comparisons (category_id, status, created_at desc);
create index idx_comparisons_onboarding on public.comparisons (is_onboarding) where is_onboarding = true;

-- ============================================================
-- votes
-- ============================================================
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  option_id uuid not null references public.comparison_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, comparison_id)
);

alter table public.votes enable row level security;

create policy "users can view own votes"
  on public.votes for select
  using (auth.uid() = user_id);

create policy "users can insert own votes"
  on public.votes for insert
  with check (auth.uid() = user_id);

create index idx_votes_comparison on public.votes (comparison_id);
create index idx_votes_user on public.votes (user_id);

-- ============================================================
-- comments + comment_likes
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id uuid not null references public.comparison_options(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  like_count int not null default 0,
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "active comments are publicly readable"
  on public.comments for select
  using (status = 'active');

create policy "users can insert own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id);

create policy "users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

create index idx_comments_comparison_option on public.comments (comparison_id, option_id);

-- A comment can only be attached to the option the commenter actually voted for —
-- this is what gives the side-split discussion without a separate "side" field.
create function public.check_comment_matches_vote()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.votes v
    where v.user_id = new.user_id
      and v.comparison_id = new.comparison_id
      and v.option_id = new.option_id
  ) then
    raise exception 'You must vote for this option before commenting on it';
  end if;
  return new;
end;
$$;

create trigger enforce_comment_vote
  before insert on public.comments
  for each row execute function public.check_comment_matches_vote();

create function public.handle_comment_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comparisons set comment_count = comment_count + 1 where id = new.comparison_id;
  elsif tg_op = 'DELETE' then
    update public.comparisons set comment_count = greatest(comment_count - 1, 0) where id = old.comparison_id;
  end if;
  return null;
end;
$$;

create trigger on_comment_count_change
  after insert or delete on public.comments
  for each row execute function public.handle_comment_count();

create table public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

create policy "likes are publicly readable"
  on public.comment_likes for select
  using (true);

create policy "users can like as self"
  on public.comment_likes for insert
  with check (auth.uid() = user_id);

create policy "users can unlike own like"
  on public.comment_likes for delete
  using (auth.uid() = user_id);

create function public.handle_comment_like_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1 where id = new.comment_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comments set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_comment_like_change
  after insert or delete on public.comment_likes
  for each row execute function public.handle_comment_like_change();

-- ============================================================
-- preference_dna
-- ============================================================
create table public.preference_dna (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  breakdown jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.preference_dna enable row level security;

create policy "dna is publicly readable"
  on public.preference_dna for select
  using (true);

-- ============================================================
-- cards
-- ============================================================
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  share_slug text unique not null default substr(md5(random()::text), 1, 8),
  ai_summary text,
  ai_summary_generated_at timestamptz,
  snapshot jsonb,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "cards are publicly readable"
  on public.cards for select
  using (true);

create policy "users can insert own card"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "users can update own card"
  on public.cards for update
  using (auth.uid() = user_id);

-- ============================================================
-- vote-count + preference DNA maintenance
-- ============================================================
create function public.handle_new_vote()
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

  return new;
end;
$$;

create trigger on_vote_created
  after insert on public.votes
  for each row execute function public.handle_new_vote();

-- ============================================================
-- card compare RPC — agreement rate on shared comparisons
-- ============================================================
create function public.compare_users(user_a uuid, user_b uuid)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_total int;
  v_agree int;
  v_result jsonb;
begin
  select count(*) into v_total
  from public.votes va
  join public.votes vb on va.comparison_id = vb.comparison_id
  where va.user_id = user_a and vb.user_id = user_b;

  select count(*) into v_agree
  from public.votes va
  join public.votes vb on va.comparison_id = vb.comparison_id
  where va.user_id = user_a and vb.user_id = user_b and va.option_id = vb.option_id;

  select jsonb_build_object(
    'shared_comparisons', v_total,
    'agreed', v_agree,
    'compatibility_pct', case when v_total > 0 then round((v_agree::numeric / v_total) * 100, 1) else null end,
    'agreements', coalesce((
      select jsonb_agg(jsonb_build_object('comparison_id', va.comparison_id, 'option_label', co.label))
      from public.votes va
      join public.votes vb on va.comparison_id = vb.comparison_id and va.option_id = vb.option_id
      join public.comparison_options co on co.id = va.option_id
      where va.user_id = user_a and vb.user_id = user_b
      limit 10
    ), '[]'::jsonb),
    'differences', coalesce((
      select jsonb_agg(jsonb_build_object(
        'comparison_id', va.comparison_id,
        'user_a_label', coa.label,
        'user_b_label', cob.label
      ))
      from public.votes va
      join public.votes vb on va.comparison_id = vb.comparison_id and va.option_id <> vb.option_id
      join public.comparison_options coa on coa.id = va.option_id
      join public.comparison_options cob on cob.id = vb.option_id
      where va.user_id = user_a and vb.user_id = user_b
      limit 10
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.compare_users(uuid, uuid) to authenticated, anon;

-- ============================================================
-- seed categories
-- ============================================================
insert into public.categories (slug, label, emoji, sort_order) values
  ('music', 'Music', '🎵', 1),
  ('cars', 'Cars', '🚗', 2),
  ('fashion', 'Fashion', '👟', 3),
  ('travel', 'Travel', '✈️', 4),
  ('gaming', 'Gaming', '🎮', 5),
  ('sports', 'Sports', '⚽', 6),
  ('food', 'Food', '🍔', 7),
  ('movies', 'Movies', '🎬', 8),
  ('technology', 'Technology', '💻', 9)
on conflict (slug) do nothing;
