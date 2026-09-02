"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { toggleComparisonLikeAction } from "@/lib/actions/likes";
import { toggleSaveComparisonAction } from "@/lib/actions/saves";
import { toggleFollowAction } from "@/lib/actions/follows";
import { incrementComparisonViewAction } from "@/lib/actions/viewComparison";
import { Avatar } from "@/components/ui/Avatar";
import { LightbulbIcon, HeartIcon, SparkleIcon, FlameIcon } from "@/components/ui/icons";
import { SquircleTile } from "@/components/SquircleTile";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { VerdictBanner } from "@/components/VerdictBanner";
import { ShareSheet } from "@/components/ShareSheet";
import type { VerdictState } from "@/components/VerdictBadge";
import { SPRING_SNAPPY } from "@/lib/motion";
import { buzz, HAPTIC } from "@/lib/haptics";
import { tileGridClass, tileSpanClass } from "@/lib/tileLayout";
import { glowForId } from "@/lib/tileArt";
import { computeVerdict } from "@/lib/verdict";
import { formatCount } from "@/lib/formatCount";
import { formatTimeLeft, isExpired } from "@/lib/countdown";
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
  // onPanEnd below), not just directly over the tiles — onPan is a pure
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
        showToast("Couldn't like that — try again");
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
        showToast("Couldn't save that — try again");
      })
      .finally(() => setSavePending(false));
  };

  const openShare = () => {
    buzz(10);
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
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(900px 520px at 50% -8%, ${glowForId(comparison.id)}2e, transparent 60%)`,
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
          <AuthorRow creator={comparison.creator} followedByMe={comparison.followedByMe} viewerId={viewerId} />
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
            />
            <SquircleTile
              option={options[1]}
              onTap={() => vote(options[1].id)}
              glow={rightGlow}
              hasVoted={hasVoted}
              chosen={votedOptionId === options[1].id}
              pct={pctFor(options[1])}
              verdict={verdictFor(options[1])}
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
              />
            ))}
          </div>
        )}

      <div className="shrink-0">
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

      <CommentsPreview comparison={comparison} onOpen={() => router.push(`/comparison/${comparison.id}`)} />

      <button
        onClick={() => router.push(`/comparison/${comparison.id}`)}
        className="tap-scale flex shrink-0 items-center gap-1 text-sm font-medium text-text-secondary"
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
          icon={<CommentIcon />}
          count={comparison.commentCount}
        />
        <ActionButton
          label="Share"
          onClick={openShare}
          icon={<ShareIcon />}
          active={comparison.repostedByMe}
          count={comparison.repostCount}
        />
        <ActionButton label="Save" onClick={toggleSave} icon={<SaveIcon filled={saved} />} active={saved} />
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
    </motion.div>
  );
}

function AuthorRow({
  creator,
  followedByMe,
  viewerId,
}: {
  creator: NonNullable<FeedComparisonData["creator"]>;
  followedByMe: boolean;
  viewerId: string | null;
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
              <PlusIcon /> Follow
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CommentsPreview({
  comparison,
  onOpen,
}: {
  comparison: FeedComparisonData;
  onOpen: () => void;
}) {
  const { topComments, commentCount } = comparison;

  if (commentCount === 0) {
    return (
      <button
        onClick={onOpen}
        className="tap-scale glass flex min-h-24 flex-1 flex-col items-center justify-center gap-1 rounded-3xl px-4 py-3 text-center"
      >
        <p className="text-sm font-semibold text-text-secondary">Be the first to comment</p>
        <p className="text-xs text-text-secondary/70">Say what&apos;s on your mind</p>
      </button>
    );
  }

  return (
    <button onClick={onOpen} className="tap-scale glass flex flex-1 flex-col justify-center rounded-3xl px-4 py-3 text-left">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-text-primary">What people are saying</p>
        <span className="text-xs font-semibold text-accent">See all {commentCount}</span>
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

function CommentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4.3A7.96 7.96 0 0 1 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? "var(--accent)" : "none"}>
      <path
        d="M6 4h12v16l-6-4-6 4V4Z"
        stroke={filled ? "var(--accent)" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15V3m0 0L7 8m5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
