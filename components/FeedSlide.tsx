"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { toggleComparisonLikeAction } from "@/lib/actions/likes";
import { postCommentAction } from "@/lib/actions/comments";
import { toggleSaveComparisonAction } from "@/lib/actions/saves";
import { toggleFollowAction } from "@/lib/actions/follows";
import { incrementComparisonViewAction } from "@/lib/actions/viewComparison";
import { Avatar } from "@/components/ui/Avatar";
import { LightbulbIcon, HeartIcon, SparkleIcon, FlameIcon, CommentIcon, SaveIcon, ShareIcon, PlusIcon, MoreIcon, SendIcon } from "@/components/ui/icons";
import { SquircleTile } from "@/components/SquircleTile";
import { VoteResultBar } from "@/components/VoteResultBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { VerdictBanner } from "@/components/VerdictBanner";
import { ShareSheet } from "@/components/ShareSheet";
import { PostOptionsMenu } from "@/components/PostOptionsMenu";
import type { VerdictState } from "@/components/VerdictBadge";
import { SPRING_SNAPPY } from "@/lib/motion";
import { buzz, HAPTIC } from "@/lib/haptics";
import { tileGridClass, tileSpanClass } from "@/lib/tileLayout";
import { glowForId } from "@/lib/tileArt";
import { computeVerdict } from "@/lib/verdict";
import { formatCount } from "@/lib/formatCount";
import { formatTimeLeft, isExpired } from "@/lib/countdown";
import { formatRelativeTime } from "@/lib/relativeTime";
import type { FeedComparisonData, FeedOptionData } from "@/lib/feedComparisons";

const VOTE_DISTANCE_THRESHOLD = 110;
const VOTE_VELOCITY_THRESHOLD = 450;

export function FeedSlide({
  comparison,
  onVote,
  viewerId = null,
}: {
  comparison: FeedComparisonData;
  onVote: (optionId: string) => void;
  viewerId?: string | null;
}) {
  const router = useRouter();
  const { options, votedOptionId } = comparison;
  const hasVoted = !!votedOptionId;
  const isBinary = options.length === 2;
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const pctFor = (o: FeedOptionData) => (total > 0 ? Math.round((o.voteCount / total) * 100) : 0);
  const verdict = computeVerdict(options);
  const verdictFor = (o: FeedOptionData): VerdictState =>
    verdict.winnerIds.includes(o.id) ? (verdict.isTie ? "tied" : "winning") : undefined;
  const expired = isExpired(comparison.expiresAt);
  const engagement = total + comparison.commentCount + comparison.viewCount;

  const [liked, setLiked] = useState(comparison.likedByMe);
  const [likeCount, setLikeCount] = useState(comparison.likeCount);
  const [saved, setSaved] = useState(comparison.savedByMe);
  const [likePending, setLikePending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const isOwnPost = !!viewerId && comparison.creator?.id === viewerId;

  // Opens the owner menu (Pin/Lock/View voters) on your own posts, or the
  // share sheet on other people's - this is the one discoverable entry
  // point for both, since long-press is used per-tile for image zoom
  // instead (a card-wide long-press would fire at the same time as a
  // tile's own long-press and open both at once).
  const openOptionsOrShare = () => {
    if (isOwnPost) setOptionsMenuOpen(true);
    else openShare();
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-10, 10]);
  const leftGlow = useTransform(x, [-160, 0], [0.85, 0]);
  const rightGlow = useTransform(x, [0, 160], [0, 0.85]);

  const heading = comparison.prompt || options.map((o) => o.label).join(" or ");
  const caption = comparison.caption;
  const captionTruncated = caption && caption.length > 90 && !captionExpanded;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1600);
  };

  useEffect(() => {
    const key = `viewed:${comparison.id}`;
    if (typeof window === "undefined" || sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    incrementComparisonViewAction(comparison.id).catch(() => {});
  }, [comparison.id]);

  const vote = (optionId: string) => {
    if (optionId === votedOptionId) return;
    if (!viewerId) {
      router.push("/login");
      return;
    }
    buzz(18);
    animate(x, 0, SPRING_SNAPPY);
    onVote(optionId);
  };

  // Swiping works from anywhere on the slide (see the outer div's onPan/
  // onPanEnd below), not just directly over the tiles - onPan is a pure
  // gesture callback (unlike `drag`) so it doesn't move the element it's
  // attached to; it only drives the shared `x`/`rotate` values that the
  // tile grid alone renders, so only the tiles visually tilt.
  const handlePan = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isBinary) return;
    // Axis-lock: ignore panning that's more vertical than horizontal so a
    // vertical scroll gesture never gets mistaken for a vote-swipe.
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      x.set(info.offset.x);
    }
  };

  const handlePanEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isBinary) return;
    if (info.offset.x < -VOTE_DISTANCE_THRESHOLD || info.velocity.x < -VOTE_VELOCITY_THRESHOLD) {
      vote(options[0].id);
    } else if (info.offset.x > VOTE_DISTANCE_THRESHOLD || info.velocity.x > VOTE_VELOCITY_THRESHOLD) {
      vote(options[1].id);
    } else {
      animate(x, 0, SPRING_SNAPPY);
    }
  };

  // Double-tap always likes (never unlikes) - matches the familiar
  // Instagram-style pattern where the heart burst plays regardless, but a
  // double-tap on an already-liked post is a no-op on the like state itself.
  const likeViaDoubleTap = () => {
    if (!viewerId || liked || likePending) return;
    toggleLike();
  };

  const toggleLike = () => {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    if (likePending) return;
    const next = !liked;
    setLikePending(true);
    buzz(next ? [...HAPTIC.success] : 8);
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    toggleComparisonLikeAction(comparison.id, next)
      .catch(() => {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
        showToast("Couldn't like that - try again");
      })
      .finally(() => setLikePending(false));
  };

  const toggleSave = () => {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    if (savePending) return;
    const next = !saved;
    setSavePending(true);
    buzz(next ? 14 : 8);
    setSaved(next);
    showToast(next ? "Saved for later" : "Removed from saved");
    toggleSaveComparisonAction(comparison.id, next)
      .catch(() => {
        setSaved(!next);
        showToast("Couldn't save that - try again");
      })
      .finally(() => setSavePending(false));
  };

  const openShare = async () => {
    buzz(10);
    if (typeof navigator !== "undefined" && navigator.share) {
      const url = `${window.location.origin}/d/${comparison.id}`;
      try {
        await navigator.share({ title: heading, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    setShareOpen(true);
  };

  return (
    <motion.div
      className="relative flex w-full shrink-0 overflow-hidden rounded-t-[28px]"
      style={{
        height: "calc(100% - 30px)",
        scrollSnapAlign: "start",
        touchAction: isBinary ? "pan-y" : undefined,
      }}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[140px]"
        style={{
          background: `radial-gradient(100% 100% at 50% 0%, ${glowForId(comparison.id)}18, transparent 70%)`,
        }}
      />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              className="glass absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold text-text-primary"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {comparison.repostedBy && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
            <span>🔁</span> Reposted by @{comparison.repostedBy}
          </p>
        )}
        {comparison.creator && (
          <AuthorRow
            creator={comparison.creator}
            followedByMe={comparison.followedByMe}
            viewerId={viewerId}
            createdAt={comparison.createdAt}
            onMore={openOptionsOrShare}
          />
        )}

        {isBinary ? (
          <motion.div style={{ x, rotate }} className="grid shrink-0 grid-cols-2 gap-3">
            <SquircleTile
              option={options[0]}
              onTap={() => vote(options[0].id)}
              glow={leftGlow}
              hasVoted={hasVoted}
              chosen={votedOptionId === options[0].id}
              pct={pctFor(options[0])}
              verdict={verdictFor(options[0])}
              onDoubleTap={likeViaDoubleTap}
              onLongPress={options[0].imageUrl ? () => setZoomedImage(options[0].imageUrl) : undefined}
              badgeNumber={1}
            />
            <SquircleTile
              option={options[1]}
              onTap={() => vote(options[1].id)}
              glow={rightGlow}
              hasVoted={hasVoted}
              chosen={votedOptionId === options[1].id}
              pct={pctFor(options[1])}
              verdict={verdictFor(options[1])}
              onDoubleTap={likeViaDoubleTap}
              onLongPress={options[1].imageUrl ? () => setZoomedImage(options[1].imageUrl) : undefined}
              badgeNumber={2}
            />
          </motion.div>
        ) : (
          <div
            className={clsx("grid shrink-0 gap-3", tileGridClass(options.length))}
            style={{ aspectRatio: options.length === 6 ? "1 / 2" : options.length === 5 ? "2 / 3" : "1" }}
          >
            {options.map((option, i) => (
              <SquircleTile
                key={option.id}
                option={option}
                onTap={() => vote(option.id)}
                hasVoted={hasVoted}
                chosen={votedOptionId === option.id}
                pct={pctFor(option)}
                verdict={verdictFor(option)}
                fill
                className={tileSpanClass(options.length, i)}
                onDoubleTap={likeViaDoubleTap}
                onLongPress={option.imageUrl ? () => setZoomedImage(option.imageUrl) : undefined}
                badgeNumber={i + 1}
              />
            ))}
          </div>
        )}

        {hasVoted && (
          <VoteResultBar
            options={options.map((o) => ({
              id: o.id,
              label: o.label,
              pct: pctFor(o),
              isWinner: verdict.winnerIds.includes(o.id),
            }))}
          />
        )}

      <div className="shrink-0">
        {comparison.isSponsored && (
          <span className="glass mb-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold text-text-secondary">
            Sponsored{comparison.sponsorLabel ? ` · ${comparison.sponsorLabel}` : ""}
          </span>
        )}
        {comparison.expiresAt && (expired ? (
          <VerdictBanner comparisonId={comparison.id} options={options} />
        ) : (
          formatTimeLeft(comparison.expiresAt) && (
            <span className="mb-2 inline-block rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger">
              ⏱ {formatTimeLeft(comparison.expiresAt)}
            </span>
          )
        ))}
        <p className="text-3xl font-black leading-[1.1] tracking-tight text-text-primary">
          {heading}
        </p>
        {comparison.hashtags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-x-2 text-sm font-semibold text-accent">
            {comparison.hashtags.map((tag) => (
              <Link key={tag} href={`/hashtag/${tag}`}>
                #{tag}
              </Link>
            ))}
          </div>
        )}
        {caption && (
          <p className="mt-2 text-sm text-text-secondary">
            {captionTruncated ? `${caption.slice(0, 90)}…` : caption}{" "}
            {caption.length > 90 && (
              <button
                onClick={() => setCaptionExpanded((v) => !v)}
                className="tap-scale font-semibold text-accent"
              >
                {captionTruncated ? "more" : "less"}
              </button>
            )}
          </p>
        )}
        {hasVoted && comparison.funFact && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-text-secondary">
            <LightbulbIcon size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>{comparison.funFact}</span>
          </p>
        )}
      </div>

      <CommentsPreview
        comparison={comparison}
        viewerId={viewerId}
        onOpen={() => router.push(`/comparison/${comparison.id}`)}
        onRequireLogin={() => router.push("/login")}
      />

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => router.push(`/comparison/${comparison.id}`)}
          className="tap-scale flex items-center gap-1 text-sm font-medium text-text-secondary"
        >
          {engagement > 0 ? (
            <>
              <AnimatedNumber value={engagement} className="font-bold text-text-primary" />
              <span>people debating this</span>
            </>
          ) : (
            <span className="font-bold text-accent">Be the first to vote</span>
          )}
        </button>
        {comparison.viewCount > 0 && (
          <span className="text-xs text-text-secondary">· {formatCount(comparison.viewCount)} views</span>
        )}
      </div>

      <div className="mt-auto flex shrink-0 items-center justify-between pr-1 pt-2">
        <ActionButton
          label="Like"
          onClick={toggleLike}
          icon={<HeartIcon size={20} filled={liked} />}
          active={liked}
          count={likeCount}
        />
        <ActionButton
          label="Comment"
          onClick={() => router.push(`/comparison/${comparison.id}`)}
          icon={<CommentIcon size={20} />}
          count={comparison.commentCount}
        />
        <ActionButton
          label="Share"
          onClick={openShare}
          icon={<ShareIcon size={20} />}
          active={comparison.repostedByMe}
          count={comparison.repostCount}
        />
        <ActionButton label="Save" onClick={toggleSave} icon={<SaveIcon size={20} filled={saved} />} active={saved} />
      </div>

      </div>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        comparisonId={comparison.id}
        heading={heading}
        initialReposted={comparison.repostedByMe}
        initialRepostCount={comparison.repostCount}
        loggedIn={!!viewerId}
        onRequireLogin={() => {
          setShareOpen(false);
          router.push("/login");
        }}
      />
      {isOwnPost && (
        <PostOptionsMenu
          open={optionsMenuOpen}
          onClose={() => setOptionsMenuOpen(false)}
          comparisonId={comparison.id}
          initialPinned={comparison.isPinned}
          initialLocked={comparison.commentsLocked}
        />
      )}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative h-[70vh] w-[92vw]"
            >
              <Image src={zoomedImage} alt="" fill className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AuthorRow({
  creator,
  followedByMe,
  viewerId,
  createdAt,
  onMore,
}: {
  creator: NonNullable<FeedComparisonData["creator"]>;
  followedByMe: boolean;
  viewerId: string | null;
  createdAt: string;
  onMore: () => void;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(followedByMe);
  const [pending, setPending] = useState(false);
  const isSelf = viewerId === creator.id;

  if (creator.isSeedAccount) {
    return (
      <div className="flex shrink-0 items-center gap-2">
        <div className="accent-gradient flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-white shadow-[0_2px_10px_-2px_var(--accent)]">
          <SparkleIcon size={15} />
        </div>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
          This or That
        </span>
        <span className="shrink-0 text-xs text-text-secondary">{formatRelativeTime(createdAt)}</span>
        <button type="button" onClick={onMore} aria-label="More options" className="tap-scale shrink-0 p-1 text-text-secondary">
          <MoreIcon size={18} />
        </button>
      </div>
    );
  }

  const toggleFollow = () => {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    if (pending) return;
    const next = !following;
    setPending(true);
    setFollowing(next);
    buzz(next ? 14 : 8);
    toggleFollowAction(creator.id, next)
      .catch(() => setFollowing(!next))
      .finally(() => setPending(false));
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Avatar name={creator.username} src={creator.avatarUrl} size={30} />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
        @{creator.username}
      </span>
      <span className="shrink-0 text-xs text-text-secondary">{formatRelativeTime(createdAt)}</span>
      {!isSelf && (
        <motion.button
          type="button"
          onClick={toggleFollow}
          whileTap={{ scale: 0.85 }}
          aria-label={following ? "Unfollow" : "Follow"}
          className={clsx(
            "flex h-7 items-center gap-1 rounded-full px-3 text-xs font-bold transition-colors",
            following ? "glass text-text-secondary" : "accent-gradient text-white"
          )}
        >
          {following ? (
            "Following"
          ) : (
            <>
              <PlusIcon size={12} /> Follow
            </>
          )}
        </motion.button>
      )}
      <button type="button" onClick={onMore} aria-label="More options" className="tap-scale shrink-0 p-1 text-text-secondary">
        <MoreIcon size={18} />
      </button>
    </div>
  );
}


function CommentsPreview({
  comparison,
  viewerId,
  onOpen,
  onRequireLogin,
}: {
  comparison: FeedComparisonData;
  viewerId: string | null;
  onOpen: () => void;
  onRequireLogin: () => void;
}) {
  const { topComments, commentCount, commentsLocked, votedOptionId, options, id: comparisonId } = comparison;
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [localCount, setLocalCount] = useState(commentCount);

  const send = () => {
    const body = draft.trim();
    if (!body || posting) return;
    if (!viewerId) {
      onRequireLogin();
      return;
    }
    const optionId = votedOptionId ?? options[0].id;
    setPosting(true);
    postCommentAction(comparisonId, optionId, body)
      .then(() => {
        setDraft("");
        setLocalCount((c) => c + 1);
        buzz(HAPTIC.tap);
      })
      .catch(() => {})
      .finally(() => setPosting(false));
  };

  if (commentsLocked) {
    return (
      <button
        onClick={onOpen}
        className="tap-scale glass flex h-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-4 py-3 text-center"
      >
        <p className="text-sm font-semibold text-text-secondary">Comments are locked</p>
        <p className="text-xs text-text-secondary/70">The creator turned off comments</p>
      </button>
    );
  }

  return (
    <div className="glass flex shrink-0 flex-col rounded-xl px-4 py-3">
      {localCount > 0 ? (
        <button onClick={onOpen} className="tap-scale flex flex-col text-left">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-primary">What people are saying</p>
            <span className="text-xs font-semibold text-accent">See all {localCount}</span>
          </div>
          <div className="mt-3 space-y-3">
            {topComments.map((comment, i) => (
              <div
                key={comment.id}
                className={clsx(
                  "flex items-start gap-2.5",
                  i === 0 && "-mx-2 rounded-xl bg-accent-soft px-2 py-1.5"
                )}
              >
                <Avatar name={comment.author.username} src={comment.author.avatarUrl} size={30} />
                <div className="min-w-0 flex-1">
                  {i === 0 && (
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent">
                      <FlameIcon size={10} />
                      Hot take
                    </p>
                  )}
                  <p className="truncate text-sm text-text-primary">
                    <span className="font-semibold">{comment.author.username}</span>{" "}
                    <span className="text-text-secondary">{comment.body}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </button>
      ) : (
        <p className="text-sm font-semibold text-text-secondary">Say what&apos;s on your mind</p>
      )}
      <div className={clsx("flex items-center gap-2", localCount > 0 && "mt-3")}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          onFocus={() => {
            if (!viewerId) onRequireLogin();
          }}
          placeholder="Add a comment…"
          maxLength={2000}
          className="min-w-0 flex-1 rounded-full bg-black/20 px-3.5 py-2 text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim() || posting}
          aria-label="Post comment"
          className="tap-scale flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-accent disabled:opacity-30"
        >
          <SendIcon size={18} />
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  disabled,
  count,
  active,
  className,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  count?: number;
  active?: boolean;
  className?: string;
}) {
  const [pulse, setPulse] = useState(0);

  const handleClick = () => {
    if (disabled) return;
    setPulse((p) => p + 1);
    onClick();
  };

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={handleClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.85 }}
      className={clsx(
        "relative flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-2.5 text-text-secondary transition-colors disabled:opacity-30",
        active && "text-accent",
        className
      )}
    >
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
        <AnimatePresence>
          {pulse > 0 && (
            <motion.span
              key={pulse}
              initial={{ opacity: 0.5, scale: 0.2 }}
              animate={{ opacity: 0, scale: 2.2 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-full bg-accent"
            />
          )}
        </AnimatePresence>
        <motion.span
          key={active ? "on" : "off"}
          initial={{ scale: active ? 0.3 : 0.7, opacity: 0.6, rotate: active ? -12 : 0 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 650, damping: 11 }}
          className="relative flex items-center justify-center"
        >
          {icon}
        </motion.span>
      </span>
      {!!count && count > 0 && <span className="text-xs font-semibold">{formatCount(count)}</span>}
    </motion.button>
  );
}

