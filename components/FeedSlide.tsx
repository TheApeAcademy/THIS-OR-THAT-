"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { gradientForLabel, letterForLabel } from "@/lib/tileArt";
import { toggleComparisonLikeAction } from "@/lib/actions/likes";
import { toggleSaveComparisonAction } from "@/lib/actions/saves";
import { Avatar } from "@/components/ui/Avatar";
import type { FeedComparisonData, FeedOptionData } from "@/lib/feedComparisons";

const VOTE_DISTANCE_THRESHOLD = 110;
const VOTE_VELOCITY_THRESHOLD = 450;

export function FeedSlide({
  comparison,
  onVote,
}: {
  comparison: FeedComparisonData;
  onVote: (optionId: string) => void;
}) {
  const router = useRouter();
  const { options, votedOptionId } = comparison;
  const hasVoted = !!votedOptionId;
  const isBinary = options.length === 2;
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const pctFor = (o: FeedOptionData) => (total > 0 ? Math.round((o.voteCount / total) * 100) : 0);

  const [liked, setLiked] = useState(comparison.likedByMe);
  const [likeCount, setLikeCount] = useState(comparison.likeCount);
  const [saved, setSaved] = useState(comparison.savedByMe);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const buzz = (ms: number) => {
    try {
      navigator.vibrate?.(ms);
    } catch {
      // unsupported — ignore
    }
  };

  const vote = (optionId: string) => {
    if (hasVoted) return;
    buzz(18);
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    onVote(optionId);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (hasVoted || !isBinary) return;
    if (info.offset.x < -VOTE_DISTANCE_THRESHOLD || info.velocity.x < -VOTE_VELOCITY_THRESHOLD) {
      vote(options[0].id);
    } else if (info.offset.x > VOTE_DISTANCE_THRESHOLD || info.velocity.x > VOTE_VELOCITY_THRESHOLD) {
      vote(options[1].id);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  const toggleLike = () => {
    const next = !liked;
    buzz(next ? 14 : 8);
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    toggleComparisonLikeAction(comparison.id, next).catch(() => {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      showToast("Couldn't like that — try again");
    });
  };

  const toggleSave = () => {
    const next = !saved;
    buzz(next ? 14 : 8);
    setSaved(next);
    showToast(next ? "Saved for later" : "Removed from saved");
    toggleSaveComparisonAction(comparison.id, next).catch(() => {
      setSaved(!next);
      showToast("Couldn't save that — try again");
    });
  };

  const share = async () => {
    buzz(10);
    const url = `${window.location.origin}/comparison/${comparison.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: heading, url });
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied!");
    } catch {
      showToast("Couldn't copy link");
    }
  };

  return (
    <div
      className="relative flex w-full shrink-0 flex-col gap-4 overflow-y-auto px-4 py-4"
      style={{ height: "100%", scrollSnapAlign: "start" }}
    >
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

      {isBinary ? (
        <motion.div
          drag={hasVoted ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          style={{ x, rotate }}
          onDragEnd={handleDragEnd}
          className="relative grid shrink-0 grid-cols-2 gap-3"
        >
          <Tile
            option={options[0]}
            onTap={() => vote(options[0].id)}
            glow={leftGlow}
            hasVoted={hasVoted}
            chosen={votedOptionId === options[0].id}
            pct={pctFor(options[0])}
          />
          <Tile
            option={options[1]}
            onTap={() => vote(options[1].id)}
            glow={rightGlow}
            hasVoted={hasVoted}
            chosen={votedOptionId === options[1].id}
            pct={pctFor(options[1])}
          />
        </motion.div>
      ) : (
        <div
          className="grid shrink-0 grid-cols-2 grid-rows-2 gap-3"
          style={{ aspectRatio: "1" }}
        >
          {options.map((option, i) => (
            <Tile
              key={option.id}
              option={option}
              onTap={() => vote(option.id)}
              hasVoted={hasVoted}
              chosen={votedOptionId === option.id}
              pct={pctFor(option)}
              fill
              className={options.length === 3 && i === 0 ? "row-span-2" : undefined}
            />
          ))}
        </div>
      )}

      <div className="shrink-0">
        <p className="text-4xl font-black leading-[1.05] tracking-tight text-text-primary">
          {heading}
        </p>
        {caption && (
          <p className="mt-2 text-sm text-text-secondary">
            {captionTruncated ? `${caption.slice(0, 90)}…` : caption}{" "}
            {caption.length > 90 && (
              <button
                onClick={() => setCaptionExpanded((v) => !v)}
                className="font-semibold text-accent"
              >
                {captionTruncated ? "more" : "less"}
              </button>
            )}
          </p>
        )}
        {hasVoted && (
          <p className="mt-1 text-xs font-medium text-text-secondary">{total} votes</p>
        )}
      </div>

      <AnimatePresence>
        {hasVoted && comparison.funFact && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 26, delay: 0.15 }}
            className="glass shrink-0 rounded-2xl px-4 py-3"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-accent">
              💡 Did you know?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-primary">{comparison.funFact}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass flex shrink-0 items-center justify-between rounded-full px-3 py-3">
        {isBinary && (
          <ActionButton
            label={options[0].label}
            onClick={() => vote(options[0].id)}
            disabled={hasVoted}
            icon={<ArrowIcon direction="left" />}
          />
        )}
        <ActionButton
          label="Like"
          onClick={toggleLike}
          icon={<HeartIcon filled={liked} />}
          active={liked}
          badge={likeCount > 0 ? likeCount : undefined}
        />
        <ActionButton
          label="Save"
          onClick={toggleSave}
          icon={<SaveIcon filled={saved} />}
          active={saved}
        />
        <ActionButton label="Share" onClick={share} icon={<ShareIcon />} />
        {isBinary && (
          <ActionButton
            label={options[1].label}
            onClick={() => vote(options[1].id)}
            disabled={hasVoted}
            icon={<ArrowIcon direction="right" />}
          />
        )}
      </div>

      <CommentsPreview comparison={comparison} onOpen={() => router.push(`/comparison/${comparison.id}`)} />
    </div>
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
        {topComments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-2.5">
            <Avatar name={comment.author.username} src={comment.author.avatarUrl} size={30} />
            <p className="min-w-0 flex-1 truncate text-sm text-text-primary">
              <span className="font-semibold">{comment.author.username}</span>{" "}
              <span className="text-text-secondary">{comment.body}</span>
            </p>
          </div>
        ))}
      </div>
    </button>
  );
}

function Tile({
  option,
  onTap,
  glow,
  hasVoted,
  chosen,
  pct,
  fill,
  className,
}: {
  option: FeedOptionData;
  onTap: () => void;
  glow?: ReturnType<typeof useTransform<number, number>>;
  hasVoted: boolean;
  chosen: boolean;
  pct: number;
  fill?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onTap}
      disabled={hasVoted}
      whileTap={hasVoted ? undefined : { scale: 0.94 }}
      className={clsx(
        "relative w-full overflow-hidden rounded-[32px]",
        fill ? "h-full" : "aspect-square",
        className
      )}
      style={option.imageUrl ? undefined : { background: gradientForLabel(option.label) }}
    >
      {option.imageUrl ? (
        <Image src={option.imageUrl} alt={option.label} fill className="object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-7xl font-black text-white/25">
          {letterForLabel(option.label)}
        </span>
      )}
      {glow && (
        <motion.div style={{ opacity: glow }} className="pointer-events-none absolute inset-0 bg-accent mix-blend-overlay" />
      )}
      <AnimatePresence>
        {chosen && (
          <motion.span
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            className="pointer-events-none absolute inset-0 rounded-[32px] ring-4 ring-inset ring-white"
          />
        )}
      </AnimatePresence>
      {hasVoted && (
        <motion.span
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }}
          className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white"
        >
          {pct}%
        </motion.span>
      )}
    </motion.button>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  disabled,
  badge,
  active,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: number;
  active?: boolean;
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
      whileTap={disabled ? undefined : { scale: 0.7 }}
      className={clsx(
        "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full text-text-primary transition-colors disabled:opacity-30",
        active && "bg-accent/15"
      )}
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
        key={active ? "on" : "off"}
        initial={{ scale: 0.5, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 550, damping: 14 }}
        className="relative flex items-center justify-center"
      >
        {icon}
      </motion.span>
      {badge !== undefined && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-text-secondary">
          {badge}
        </span>
      )}
    </motion.button>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d={direction === "left" ? "M15 5 7 12l8 7" : "M9 5l8 7-8 7"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? "var(--danger)" : "none"}>
      <path
        d="M12 20.5s-7.5-4.6-9.8-9.1C.6 7.9 2.4 4.5 5.9 4c2-.3 3.9.7 6.1 3 2.2-2.3 4.1-3.3 6.1-3 3.5.5 5.3 3.9 3.7 7.4-2.3 4.5-9.8 9.1-9.8 9.1Z"
        stroke={filled ? "var(--danger)" : "currentColor"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? "var(--accent)" : "none"}>
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
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
