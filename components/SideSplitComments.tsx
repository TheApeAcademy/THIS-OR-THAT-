"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ReportButton } from "@/components/ReportButton";
import { postCommentAction, toggleCommentLikeAction } from "@/lib/actions/comments";
import { toggleBlockAction, toggleMuteAction } from "@/lib/actions/blocks";
import type { CommentNode } from "@/lib/commentTree";

export interface SideData {
  optionId: string;
  label: string;
  comments: CommentNode[];
}

interface SideSplitCommentsProps {
  comparisonId: string;
  sides: SideData[];
  votedOptionId: string;
  viewerId: string;
}

export function SideSplitComments({ comparisonId, sides, votedOptionId, viewerId }: SideSplitCommentsProps) {
  const votedIndex = sides.findIndex((s) => s.optionId === votedOptionId);
  const [activeIndex, setActiveIndex] = useState(votedIndex >= 0 ? votedIndex : 0);
  const active = sides[activeIndex];
  const canComment = active.optionId === votedOptionId;

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

      <div className="space-y-4">
        {active.comments.length === 0 && (
          <p className="py-8 text-center text-sm text-text-secondary">No comments yet on this side.</p>
        )}
        {active.comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            comparisonId={comparisonId}
            optionId={active.optionId}
            canReply={canComment}
            viewerId={viewerId}
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
        placeholder={parentCommentId ? "Reply…" : `Why ${label}?`}
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
}: {
  comment: CommentNode;
  comparisonId: string;
  optionId: string;
  canReply: boolean;
  viewerId: string;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(comment.likedByMe);
  const [count, setCount] = useState(comment.likeCount);
  const [replying, setReplying] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await toggleCommentLikeAction(comment.id, next);
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
          <span className="text-text-primary">{comment.body}</span>
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
          <button onClick={toggleLike} className="tap-scale">
            {liked ? "♥" : "♡"} {count}
          </button>
          {canReply && (
            <button onClick={() => setReplying((r) => !r)} className="tap-scale">
              Reply
            </button>
          )}
          {comment.author.id !== viewerId && (
            <>
              <button onClick={mute} className="tap-scale">
                Mute
              </button>
              <button onClick={block} className="tap-scale text-danger">
                Block
              </button>
            </>
          )}
          <ReportButton targetType="comment" targetId={comment.id} />
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
