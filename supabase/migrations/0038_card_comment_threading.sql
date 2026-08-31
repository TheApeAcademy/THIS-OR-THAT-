-- One column, full recursive threading (self-reference), matching the
-- existing comments.parent_comment_id pattern used for comparison comments.
alter table public.card_comments
  add column parent_comment_id uuid references public.card_comments(id) on delete cascade;

create index idx_card_comments_parent on public.card_comments (parent_comment_id);
