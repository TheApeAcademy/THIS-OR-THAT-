"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { clsx } from "clsx";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";
import { gradientForLabel, letterForLabel } from "@/lib/tileArt";
import { toggleComparisonLikeAction } from "@/lib/actions/likes";
import { toggleSaveComparisonAction } from "@/lib/actions/saves";
import type { FeedComparisonData } from "@/lib/feedComparisons";

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
  const { optionA, optionB, votedOptionId } = comparison;
  const hasVoted = !!votedOptionId;
  const total = optionA.voteCount + optionB.voteCount;
  const pctA = total > 0 ? Math.round((optionA.voteCount / total) * 100) : 0;
  const pctB = total > 0 ? 100 - pctA : 0;

  const [liked, setLiked] = useState(comparison.likedByMe);
  const [likeCount, setLikeCount] = useState(comparison.likeCount);
  const [saved, setSaved] = useState(comparison.savedByMe);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-10, 10]);
  const leftGlow = useTransform(x, [-160, 0], [0.85, 0]);
  const rightGlow = useTransform(x, [0, 160], [0, 0.85]);

  const heading = comparison.prompt || `${optionA.label} or ${optionB.label}?`;
  const caption = comparison.caption;
  const captionTruncated = caption && caption.length > 90 && !captionExpanded;

  const vote = (optionId: string) => {
    if (hasVoted) return;
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    onVote(optionId);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (hasVoted) return;
    if (info.offset.x < -VOTE_DISTANCE_THRESHOLD || info.velocity.x < -VOTE_VELOCITY_THRESHOLD) {
      vote(optionA.id);
    } else if (info.offset.x > VOTE_DISTANCE_THRESHOLD || info.velocity.x > VOTE_VELOCITY_THRESHOLD) {
      vote(optionB.id);
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    toggleComparisonLikeAction(comparison.id, next).catch(() => {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    });
  };

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    toggleSaveComparisonAction(comparison.id, next).catch(() => setSaved(!next));
  };

  const share = async () => {
    const url = `${window.location.origin}/comparison/${comparison.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: heading, url });
      } catch {
        // user cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className="flex w-full shrink-0 flex-col gap-3 px-4 py-3"
      style={{ height: "100%", scrollSnapAlign: "start" }}
    >
      <motion.div
        drag={hasVoted ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        style={{ x, rotate }}
        onDragEnd={handleDragEnd}
        className="relative grid min-h-0 flex-1 grid-cols-2 gap-3"
      >
        <Tile
          option={optionA}
          onTap={() => vote(optionA.id)}
          glow={leftGlow}
          hasVoted={hasVoted}
          chosen={votedOptionId === optionA.id}
          pct={pctA}
        />
        <Tile
          option={optionB}
          onTap={() => vote(optionB.id)}
          glow={rightGlow}
          hasVoted={hasVoted}
          chosen={votedOptionId === optionB.id}
          pct={pctB}
        />
      </motion.div>

      <div>
        <p className="text-2xl font-extrabold leading-tight tracking-tight text-text-primary">
          {heading}
        </p>
        {caption && (
          <p className="mt-1 text-sm text-text-secondary">
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

      <div className="glass flex items-center justify-between rounded-full px-2 py-2">
        <ActionButton
          label={optionA.label}
          onClick={() => vote(optionA.id)}
          disabled={hasVoted}
          icon={<ArrowIcon direction="left" />}
        />
        <ActionButton
          label="Like"
          onClick={toggleLike}
          icon={<HeartIcon filled={liked} />}
          badge={likeCount > 0 ? likeCount : undefined}
        />
        <ActionButton
          label="Comments"
          onClick={() => router.push(`/comparison/${comparison.id}`)}
          icon={<CommentIcon />}
          badge={comparison.commentCount > 0 ? comparison.commentCount : undefined}
        />
        <ActionButton label="Save" onClick={toggleSave} icon={<SaveIcon filled={saved} />} />
        <ActionButton label="Share" onClick={share} icon={<ShareIcon />} />
        <ActionButton
          label={optionB.label}
          onClick={() => vote(optionB.id)}
          disabled={hasVoted}
          icon={<ArrowIcon direction="right" />}
        />
      </div>
    </div>
  );
}

function Tile({
  option,
  onTap,
  glow,
  hasVoted,
  chosen,
  pct,
}: {
  option: FeedComparisonData["optionA"];
  onTap: () => void;
  glow: ReturnType<typeof useTransform<number, number>>;
  hasVoted: boolean;
  chosen: boolean;
  pct: number;
}) {
  return (
    <button
      onClick={onTap}
      disabled={hasVoted}
      className={clsx(
        "tap-scale relative h-full w-full overflow-hidden rounded-[32px]",
        chosen && "ring-4 ring-inset ring-white"
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
      <motion.div style={{ opacity: glow }} className="pointer-events-none absolute inset-0 bg-accent mix-blend-overlay" />
      {hasVoted && (
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white">
          {pct}%
        </span>
      )}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  disabled,
  badge,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="tap-scale relative flex h-11 w-11 items-center justify-center rounded-full text-text-primary disabled:opacity-30"
    >
      {icon}
      {badge !== undefined && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-text-secondary">
          {badge}
        </span>
      )}
    </button>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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

function CommentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16v11H8.5L4 20V5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "var(--accent)" : "none"}>
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
