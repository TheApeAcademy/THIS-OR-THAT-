"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { toggleCardLikeAction } from "@/lib/actions/cardLikes";
import { postCardCommentAction } from "@/lib/actions/cardComments";

export interface CardCommentData {
  id: string;
  body: string;
  author: { username: string; avatarUrl: string | null };
}

interface CardEngagementProps {
  cardId: string;
  shareSlug: string;
  initialLikeCount: number;
  likedByMe: boolean;
  isAuthed: boolean;
  viewerUsername?: string | null;
  viewerAvatarUrl?: string | null;
  comments: CardCommentData[];
  commentCount: number;
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

  const buzz = (ms: number) => {
    try {
      navigator.vibrate?.(ms);
    } catch {
      // unsupported — ignore
    }
  };

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

  const submitComment = async () => {
    const trimmed = draft.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    const optimistic: CardCommentData = {
      id: `local-${Date.now()}`,
      body: trimmed,
      author: { username: viewerUsername ?? "you", avatarUrl: viewerAvatarUrl ?? null },
    };
    setLocalComments((prev) => [optimistic, ...prev]);
    setLocalCount((c) => c + 1);
    setDraft("");
    try {
      await postCardCommentAction(cardId, shareSlug, trimmed);
    } catch {
      setLocalComments((prev) => prev.filter((c) => c.id !== optimistic.id));
      setLocalCount((c) => c - 1);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
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
            transition={{ type: "spring", stiffness: 550, damping: 14 }}
            className="flex items-center justify-center"
          >
            <HeartIcon filled={liked} />
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

      <div className="glass flex flex-col gap-3 rounded-2xl px-4 py-4">
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
            <Button size="sm" onClick={submitComment} disabled={posting || !draft.trim()}>
              Post
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {localComments.length === 0 && (
            <p className="text-sm text-text-secondary">No comments yet — be the first.</p>
          )}
          {localComments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.author.username} src={c.author.avatarUrl} size={28} />
              <p className="min-w-0 flex-1 text-sm text-text-primary">
                <span className="font-semibold">{c.author.username}</span>{" "}
                <span className="text-text-secondary">{c.body}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "var(--danger)" : "none"}>
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.1C.6 7.9 2.4 4.5 5.9 4c2-.3 3.9.7 6.1 3 2.2-2.3 4.1-3.3 6.1-3 3.5.5 5.3 3.9 3.7 7.4-2.3 4.5-9.8 9.1-9.8 9.1Z"
        stroke={filled ? "var(--danger)" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
