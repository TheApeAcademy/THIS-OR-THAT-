"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ReportButton } from "@/components/ReportButton";
import {
  postCommentAction,
  toggleCommentLikeAction,
  editCommentAction,
  deleteCommentAction,
} from "@/lib/actions/comments";
import { toggleBlockAction, toggleMuteAction } from "@/lib/actions/blocks";
import { timeAgo } from "@/lib/timeAgo";
import type { CommentNode } from "@/lib/commentTree";

export interface SideData {
  optionId: string;
  label: string;
  comments: CommentNode[];
}

type SortMode = "top" | "newest" | "debated";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "newest", label: "Newest" },
  { value: "debated", label: "Most debated" },
];

function countReplies(node: CommentNode): number {
  return node.replies.reduce((sum, r) => sum + 1 + countReplies(r), 0);
}

function sortComments(comments: CommentNode[], mode: SortMode): CommentNode[] {
  const copy = [...comments];
  if (mode === "newest") return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (mode === "debated") return copy.sort((a, b) => countReplies(b) - countReplies(a));
  return copy.sort((a, b) => b.likeCount - a.likeCount);
}

const MENTION_RE = /@([a-zA-Z0-9_]{2,32})/g;

function renderBody(body: string, viewerUsername: string | null): React.ReactNode {
  const parts = body.split(MENTION_RE);
  // String.split with a capturing group interleaves matched groups into the
  // result, so odd indices are the captured usernames and even indices are
  // the surrounding plain text.
  return parts.map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    return viewerUsername ? (
      <Link key={i} href={`/compare/${part}/${viewerUsername}`} className="font-semibold text-accent">
        @{part}
      </Link>
    ) : (
      <span key={i} className="font-semibold text-accent">
        @{part}
      </span>
    );
  });
}

export function SideSplitComments({
  comparisonId,
  sides,
  votedOptionId,
  viewerId,
  viewerUsername,
}: {
  comparisonId: string;
  sides: SideData[];
  votedOptionId: string;
  viewerId: string;
  viewerUsername: string | null;
}) {
  const votedIndex = sides.findIndex((s) => s.optionId === votedOptionId);
  const [activeIndex, setActiveIndex] = useState(votedIndex >= 0 ? votedIndex : 0);
  const [sortMode, setSortMode] = useState<SortMode>("top");
  const active = sides[activeIndex];
  const canComment = active.optionId === votedOptionId;

  const sortedComments = useMemo(() => sortComments(active.comments, sortMode), [active.comments, sortMode]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg bg-surface p-1">
        {sides.map((side, i) => (
          <button
            key={side.optionId}
            onClick={() => setActiveIndex(i)}
            className={clsx(
              "tap-scale flex-1 rounded-md py-2 text-sm font-semibold",
              i === activeIndex ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-secondary"
            )}
          >
            {side.label} · {side.comments.length}
          </button>
        ))}
      </div>

      {canComment && <Composer comparisonId={comparisonId} optionId={active.optionId} label={active.label} />}

      {active.comments.length > 1 && (
        <div className="flex justify-end gap-1">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setSortMode(o.value)}
              className={clsx(
                "tap-scale rounded-full px-2.5 py-1 text-xs font-semibold",
                sortMode === o.value ? "bg-accent/15 text-accent" : "text-text-secondary"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {active.comments.length === 0 && (
          <p className="py-8 text-center text-sm text-text-secondary">No comments yet on this side.</p>
        )}
        {sortedComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            comparisonId={comparisonId}
            optionId={active.optionId}
            canReply={canComment}
            viewerId={viewerId}
            viewerUsername={viewerUsername}
          />
        ))}
      </div>
    </div>
  );
}

function Composer({
  comparisonId,
  optionId,
  label,
  parentCommentId,
  onPosted,
}: {
  comparisonId: string;
  optionId: string;
  label: string;
  parentCommentId?: string;
  onPosted?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!draft.trim()) return;
    startTransition(async () => {
      await postCommentAction(comparisonId, optionId, draft.trim(), parentCommentId);
      setDraft("");
      onPosted?.();
    });
  };

  return (
    <div className="flex gap-2">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={parentCommentId ? "Reply… (@mention someone)" : `Why ${label}? (@mention someone)`}
        className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />
      <Button size="sm" onClick={submit} disabled={isPending || !draft.trim()}>
        Post
      </Button>
    </div>
  );
}

function CommentItem({
  comment,
  comparisonId,
  optionId,
  canReply,
  viewerId,
  viewerUsername,
}: {
  comment: CommentNode;
  comparisonId: string;
  optionId: string;
  canReply: boolean;
  viewerId: string;
  viewerUsername: string | null;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(comment.likedByMe);
  const [count, setCount] = useState(comment.likeCount);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [editedAt, setEditedAt] = useState(comment.editedAt);
  const [draft, setDraft] = useState(comment.body);
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();

  const isMine = comment.author.id === viewerId;

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await toggleCommentLikeAction(comment.id, next);
    });
  };

  const saveEdit = () => {
    if (!draft.trim() || draft.trim() === body) {
      setEditing(false);
      setDraft(body);
      return;
    }
    const next = draft.trim();
    setBody(next);
    setEditedAt(new Date().toISOString());
    setEditing(false);
    startTransition(async () => {
      await editCommentAction(comment.id, next).catch(() => {
        setBody(comment.body);
        setEditedAt(comment.editedAt);
      });
    });
  };

  const remove = () => {
    setHidden(true);
    startTransition(() => {
      deleteCommentAction(comment.id).catch(() => setHidden(false));
    });
  };

  const mute = () => {
    setHidden(true);
    startTransition(async () => {
      await toggleMuteAction(comment.author.id, true).catch(() => {});
      router.refresh();
    });
  };

  const block = () => {
    setHidden(true);
    startTransition(async () => {
      await toggleBlockAction(comment.author.id, true).catch(() => {});
      router.refresh();
    });
  };

  if (hidden) return null;

  return (
    <div className="flex gap-3">
      <Avatar name={comment.author.username} src={comment.author.avatarUrl} size={32} />
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold text-text-primary">{comment.author.username}</span>{" "}
          {editing ? (
            <span className="mt-1 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary outline-none focus:border-accent"
                autoFocus
              />
              <button onClick={saveEdit} className="tap-scale text-xs font-semibold text-accent">
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft(body);
                }}
                className="tap-scale text-xs text-text-secondary"
              >
                Cancel
              </button>
            </span>
          ) : (
            <span className="text-text-primary">{renderBody(body, viewerUsername)}</span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
          <span>{timeAgo(comment.createdAt)}</span>
          {editedAt && <span>· Edited</span>}
          <button onClick={toggleLike} className="tap-scale">
            {liked ? "♥" : "♡"} {count}
          </button>
          {canReply && (
            <button onClick={() => setReplying((r) => !r)} className="tap-scale">
              Reply
            </button>
          )}
          {isMine ? (
            <>
              <button onClick={() => setEditing(true)} className="tap-scale">
                Edit
              </button>
              <button onClick={remove} className="tap-scale text-danger">
                Delete
              </button>
            </>
          ) : (
            <>
              <button onClick={mute} className="tap-scale">
                Mute
              </button>
              <button onClick={block} className="tap-scale text-danger">
                Block
              </button>
              <ReportButton targetType="comment" targetId={comment.id} />
            </>
          )}
        </div>
        {replying && (
          <div className="mt-2">
            <Composer
              comparisonId={comparisonId}
              optionId={optionId}
              label=""
              parentCommentId={comment.id}
              onPosted={() => setReplying(false)}
            />
          </div>
        )}
        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-border pl-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                comparisonId={comparisonId}
                optionId={optionId}
                canReply={canReply}
                viewerId={viewerId}
                viewerUsername={viewerUsername}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
