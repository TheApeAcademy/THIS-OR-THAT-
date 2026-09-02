"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createGroupPostAction, createGroupPostCommentAction, toggleGroupPostLikeAction } from "@/lib/actions/groups";
import { formatRelativeTime } from "@/lib/relativeTime";
import { buzz } from "@/lib/haptics";

export interface GroupWallComment {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string; avatarUrl: string | null };
}

export interface GroupWallPost {
  id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  author: { username: string; avatarUrl: string | null };
  comments: GroupWallComment[];
}

export function GroupWall({
  groupId,
  initialPosts,
  canPost,
}: {
  groupId: string;
  initialPosts: GroupWallPost[];
  canPost: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const post = () => {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      try {
        await createGroupPostAction(groupId, body);
        buzz(14);
        setDraft("");
        // Optimistic: we don't have the real id/author yet without a
        // round-trip, so just prompt a refresh via location reload of the
        // server data isn't ideal - instead show it locally with a
        // temp id; the next page load will reconcile it for real.
        setPosts((prev) => [
          {
            id: `temp-${Date.now()}`,
            body,
            createdAt: new Date().toISOString(),
            likeCount: 0,
            likedByMe: false,
            author: { username: "you", avatarUrl: null },
            comments: [],
          },
          ...prev,
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't post that.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {canPost && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something to the group…"
            maxLength={500}
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={post} disabled={!draft.trim() || isPending}>
              {isPending ? "Posting…" : "Post"}
            </Button>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">No posts yet - be the first to banter.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <GroupWallPostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupWallPostCard({ post }: { post: GroupWallPost }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [comments, setComments] = useState(post.comments);
  const [commentDraft, setCommentDraft] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    buzz(next ? 14 : 8);
    toggleGroupPostLikeAction(post.id, next).catch(() => {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    });
  };

  const submitComment = () => {
    const body = commentDraft.trim();
    if (!body) return;
    startTransition(async () => {
      try {
        await createGroupPostCommentAction(post.id, body);
        setComments((prev) => [
          ...prev,
          { id: `temp-${Date.now()}`, body, createdAt: new Date().toISOString(), author: { username: "you", avatarUrl: null } },
        ]);
        setCommentDraft("");
      } catch {
        // silently ignore - the comment count/list will reconcile on next load
      }
    });
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={post.author.username} src={post.author.avatarUrl} size={30} />
        <div>
          <p className="text-sm font-semibold text-text-primary">@{post.author.username}</p>
          <p className="text-xs text-text-secondary">{formatRelativeTime(post.createdAt)}</p>
        </div>
      </div>
      <p className="text-sm text-text-primary">{post.body}</p>
      <div className="flex items-center gap-4 pt-1 text-xs font-semibold text-text-secondary">
        <button type="button" onClick={toggleLike} className={liked ? "text-accent" : ""}>
          ❤️ {likeCount > 0 ? likeCount : "Like"}
        </button>
        <button type="button" onClick={() => setShowComposer((v) => !v)}>
          💬 {comments.length > 0 ? comments.length : "Reply"}
        </button>
      </div>

      {comments.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-2">
          {comments.map((c) => (
            <p key={c.id} className="text-sm text-text-primary">
              <span className="font-semibold">@{c.author.username}</span>{" "}
              <span className="text-text-secondary">{c.body}</span>
            </p>
          ))}
        </div>
      )}

      {showComposer && (
        <div className="flex gap-2 pt-1">
          <input
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Reply…"
            maxLength={500}
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
          <Button size="sm" onClick={submitComment} disabled={!commentDraft.trim() || isPending}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}
