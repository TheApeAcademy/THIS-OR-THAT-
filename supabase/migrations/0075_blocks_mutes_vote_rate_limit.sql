-- Integration step (I1, safe layer): trust & safety foundation from the
-- branch — block/mute between users, and a vote rate limit matching the
-- shape of the existing comparison/comment limits in 0010_rate_limits.sql.
--
-- Block is mutual: neither side can follow, vote on, or comment on the
-- other's stuff. Mute is one-directional and lighter: it only hides the
-- muted user's content from the muter's own feed.
--
-- The get_feed_order rewrite that originally shipped alongside this on the
-- branch is deliberately NOT included here — main's get_feed_order has its
-- own independent history (expiry filtering) that needs a real hand-merge
-- with this branch's ranking rewrite, done as its own dedicated migration
-- once all of the branch's get_feed_order-touching pieces are collected.

-- ============================================================
-- blocks
-- ============================================================
create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self_block check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "users can view own blocks"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "users can block as self"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "users can unblock own block"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

create index idx_blocks_blocker on public.blocks (blocker_id);
create index idx_blocks_blocked on public.blocks (blocked_id);

-- Security-definer helper so a block can be enforced from restrictive
-- policies on OTHER tables (votes/comments/follows) and from
-- get_feed_order, without needing every affected user to have direct
-- read access to rows they aren't the blocker of. Returns only a
-- boolean — it never leaks which direction the block runs in.
create function public.is_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

grant execute on function public.is_blocked(uuid, uuid) to authenticated, anon;

-- ============================================================
-- mutes
-- ============================================================
create table public.mutes (
  muter_id uuid not null references public.profiles(id) on delete cascade,
  muted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  constraint mutes_no_self_mute check (muter_id <> muted_id)
);

alter table public.mutes enable row level security;

create policy "users can view own mutes"
  on public.mutes for select
  using (auth.uid() = muter_id);

create policy "users can mute as self"
  on public.mutes for insert
  with check (auth.uid() = muter_id);

create policy "users can unmute own mute"
  on public.mutes for delete
  using (auth.uid() = muter_id);

create index idx_mutes_muter on public.mutes (muter_id);

-- ============================================================
-- block enforcement — restrictive policies additively narrow the
-- existing permissive insert policies, same pattern as the suspended-user
-- checks in 0009_moderation.sql.
-- ============================================================
create policy "blocked users cannot follow each other"
  on public.follows as restrictive for insert
  with check (not public.is_blocked(follower_id, followee_id));

create policy "blocked users cannot vote across a block"
  on public.votes as restrictive for insert
  with check (
    not exists (
      select 1 from public.comparisons c
      where c.id = comparison_id
        and c.creator_id is not null
        and public.is_blocked(auth.uid(), c.creator_id)
    )
  );

create policy "blocked users cannot comment across a block"
  on public.comments as restrictive for insert
  with check (
    not exists (
      select 1 from public.comparisons c
      where c.id = comparison_id
        and c.creator_id is not null
        and public.is_blocked(auth.uid(), c.creator_id)
    )
    and not exists (
      select 1 from public.comments pc
      where pc.id = parent_comment_id
        and public.is_blocked(auth.uid(), pc.user_id)
    )
  );

-- ============================================================
-- vote rate limit — same shape as the comparison/comment limits in
-- 0010_rate_limits.sql. Generous enough for legitimate rapid-fire Play
-- use, tight enough to blunt a scripted voting bot.
-- ============================================================
create policy "rate limit voting"
  on public.votes as restrictive for insert
  with check (
    (
      select count(*) from public.votes v
      where v.user_id = auth.uid() and v.created_at > now() - interval '1 hour'
    ) < 120
  );
