"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/icons";
import { MentionText } from "@/components/MentionText";
import { toggleCardLikeAction } from "@/lib/actions/cardLikes";
import { postCardCommentAction } from "@/lib/actions/cardComments";
import { SPRING_BOUNCY } from "@/lib/motion";
import { buzz } from "@/lib/haptics";
import type { CardCommentNode } from "@/lib/commentTree";

interface CardEngagementProps {
  cardId: string;
  shareSlug: string;
  initialLikeCount: number;
  likedByMe: boolean;
  isAuthed: boolean;
  viewerUsername?: string | null;
  viewerAvatarUrl?: string | null;
  comments: CardCommentNode[];
  commentCount: number;
}

function insertReply(tree: CardCommentNode[], parentId: string, node: CardCommentNode): CardCommentNode[] {
  return tree.map((n) =>
    n.id === parentId ? { ...n, replies: [node, ...n.replies] } : { ...n, replies: insertReply(n.replies, parentId, node) }
  );
}

function removeNode(tree: CardCommentNode[], id: string): CardCommentNode[] {
  return tree.filter((n) => n.id !== id).map((n) => ({ ...n, replies: removeNode(n.replies, id) }));
}

export function CardEngagement({
  cardId,
  shareSlug,
  initialLikeCount,
  likedByMe,
  isAuthed,
  viewerUsername,
  viewerAvatarUrl,
  comments,
  commentCount,
}: CardEngagementProps) {
  const [liked, setLiked] = useState(likedByMe);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likePending, setLikePending] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [draft, setDraft] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [localCount, setLocalCount] = useState(commentCount);
  const [posting, setPosting] = useState(false);

  const toggleLike = () => {
    if (!isAuthed || likePending) return;
    const next = !liked;
    setLikePending(true);
    setPulse((p) => p + 1);
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    buzz(next ? 14 : 8);
    toggleCardLikeAction(cardId, next)
      .catch(() => {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      })
      .finally(() => setLikePending(false));
  };

  const submitComment = async (body: string, parentCommentId?: string) => {
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    const optimistic: CardCommentNode = {
      id: `local-${Date.now()}`,
      body: trimmed,
      createdAt: new Date().toISOString(),
      author: { username: viewerUsername ?? "you", avatarUrl: viewerAvatarUrl ?? null },
      replies: [],
    };
    setLocalComments((prev) => (parentCommentId ? insertReply(prev, parentCommentId, optimistic) : [optimistic, ...prev]));
    setLocalCount((c) => c + 1);
    if (!parentCommentId) setDraft("");
    try {
      await postCardCommentAction(cardId, shareSlug, trimmed, parentCommentId);
    } catch {
      setLocalComments((prev) => removeNode(prev, optimistic.id));
      setLocalCount((c) => c - 1);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex items-center gap-3 rounded-xl px-4 py-3">
        <motion.button
          type="button"
          aria-label="Like this card"
          onClick={toggleLike}
          disabled={!isAuthed}
          whileTap={isAuthed ? { scale: 0.7 } : undefined}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full disabled:opacity-40"
        >
          <AnimatePresence>
            {pulse > 0 && (
              <motion.span
                key={pulse}
                initial={{ opacity: 0.45, scale: 0.3 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-full bg-accent"
              />
            )}
          </AnimatePresence>
          <motion.span
            key={liked ? "on" : "off"}
            initial={{ scale: 0.5, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING_BOUNCY}
            className="flex items-center justify-center"
          >
            <HeartIcon size={22} filled={liked} />
          </motion.span>
        </motion.button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">
            {likeCount > 0 ? `${likeCount} ${likeCount === 1 ? "like" : "likes"}` : "Be the first to like this card"}
          </p>
          {!isAuthed && (
            <p className="text-xs text-text-secondary">
              <Link href="/login" className="font-medium text-accent">
                Sign in
              </Link>{" "}
              to like or comment
            </p>
          )}
        </div>
      </div>

      <div className="glass flex flex-col gap-3 rounded-xl px-4 py-4">
        <p className="text-sm font-bold text-text-primary">
          Comments{localCount > 0 ? ` (${localCount})` : ""}
        </p>

        {isAuthed && (
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Say something nice…"
              maxLength={500}
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
            <Button size="sm" onClick={() => submitComment(draft)} disabled={posting || !draft.trim()}>
              Post
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {localComments.length === 0 && (
            <p className="text-sm text-text-secondary">No comments yet — be the first.</p>
          )}
          {localComments.map((c) => (
            <CardCommentItem key={c.id} comment={c} isAuthed={isAuthed} posting={posting} onReply={submitComment} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardCommentItem({
  comment,
  isAuthed,
  posting,
  onReply,
}: {
  comment: CardCommentNode;
  isAuthed: boolean;
  posting: boolean;
  onReply: (body: string, parentCommentId: string) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");

  return (
    <div className="flex items-start gap-2.5">
      <Avatar name={comment.author.username} src={comment.author.avatarUrl} size={28} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary">
          <span className="font-semibold">{comment.author.username}</span>{" "}
          <span className="text-text-secondary">
            <MentionText text={comment.body} />
          </span>
        </p>
        {isAuthed && (
          <button onClick={() => setReplying((r) => !r)} className="tap-scale mt-1 text-xs text-text-secondary">
            Reply
          </button>
        )}
        {replying && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder="Reply…"
              maxLength={500}
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
            <Button
              size="sm"
              disabled={posting || !replyDraft.trim()}
              onClick={() => {
                onReply(replyDraft, comment.id);
                setReplyDraft("");
                setReplying(false);
              }}
            >
              Post
            </Button>
          </div>
        )}
        {comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l border-border pl-3">
            {comment.replies.map((reply) => (
              <CardCommentItem key={reply.id} comment={reply} isAuthed={isAuthed} posting={posting} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

