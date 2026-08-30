-- Social actions on comparisons (like, save-for-later) plus an optional
-- longer caption separate from the short bold heading (`prompt`).
alter table public.comparisons add column caption text check (caption is null or char_length(caption) <= 280);
alter table public.comparisons add column like_count int not null default 0;

create table public.comparison_likes (
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comparison_id, user_id)
);

alter table public.comparison_likes enable row level security;

create policy "comparison likes are publicly readable"
  on public.comparison_likes for select
  using (true);

create policy "users can like as self"
  on public.comparison_likes for insert
  with check (auth.uid() = user_id);

create policy "users can unlike own like"
  on public.comparison_likes for delete
  using (auth.uid() = user_id);

create function public.handle_comparison_like_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.comparisons set like_count = like_count + 1 where id = new.comparison_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comparisons set like_count = greatest(like_count - 1, 0) where id = old.comparison_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger on_comparison_like_change
  after insert or delete on public.comparison_likes
  for each row execute function public.handle_comparison_like_change();

create index idx_comparison_likes_comparison on public.comparison_likes (comparison_id);

-- Save-for-later is private to the saver, unlike likes.
create table public.saved_comparisons (
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comparison_id, user_id)
);

alter table public.saved_comparisons enable row level security;

create policy "users can view own saves"
  on public.saved_comparisons for select
  using (auth.uid() = user_id);

create policy "users can save as self"
  on public.saved_comparisons for insert
  with check (auth.uid() = user_id);

create policy "users can unsave own save"
  on public.saved_comparisons for delete
  using (auth.uid() = user_id);

create index idx_saved_comparisons_user on public.saved_comparisons (user_id, created_at desc);
