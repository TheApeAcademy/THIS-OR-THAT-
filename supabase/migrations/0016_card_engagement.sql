-- Let viewers like and comment on a person's public Share Card, not just
-- individual comparisons. Mirrors the comparison_likes/comments pattern.
alter table public.cards add column like_count int not null default 0;
alter table public.cards add column comment_count int not null default 0;

create table public.card_likes (
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id)
);

alter table public.card_likes enable row level security;

create policy "card likes are publicly readable"
  on public.card_likes for select
  using (true);

create policy "users can like a card as self"
  on public.card_likes for insert
  with check (auth.uid() = user_id);

create policy "users can unlike own card like"
  on public.card_likes for delete
  using (auth.uid() = user_id);

create function public.handle_card_like_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.cards set like_count = like_count + 1 where id = new.card_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cards set like_count = greatest(like_count - 1, 0) where id = old.card_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_card_like_change
  after insert or delete on public.card_likes
  for each row execute function public.handle_card_like_change();

create index idx_card_likes_card on public.card_likes (card_id);

create table public.card_comments (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now()
);

alter table public.card_comments enable row level security;

create policy "active card comments are publicly readable"
  on public.card_comments for select
  using (status = 'active');

create policy "users can comment on a card as self"
  on public.card_comments for insert
  with check (auth.uid() = user_id);

create policy "users can update own card comments"
  on public.card_comments for update
  using (auth.uid() = user_id);

create policy "users can delete own card comments"
  on public.card_comments for delete
  using (auth.uid() = user_id);

create function public.handle_card_comment_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.cards set comment_count = comment_count + 1 where id = new.card_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cards set comment_count = greatest(comment_count - 1, 0) where id = old.card_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_card_comment_count_change
  after insert or delete on public.card_comments
  for each row execute function public.handle_card_comment_count();

create index idx_card_comments_card on public.card_comments (card_id, created_at desc);
