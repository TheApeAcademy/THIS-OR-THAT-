"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import { VerdictBadge, type VerdictState } from "@/components/VerdictBadge";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { HeartIcon, ExpandIcon } from "@/components/ui/icons";

export interface SquircleTileOption {
  id: string;
  label: string;
  imageUrl: string | null;
  /** Set on Duel Mode options - the debater's own point, shown on their tile. */
  statement?: string | null;
  claimant?: { username: string; avatarUrl: string | null } | null;
}

const DOUBLE_TAP_MS = 300;
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;

export function SquircleTile({
  option,
  onTap,
  glow,
  hasVoted,
  chosen,
  pct,
  fill,
  className,
  resultTint,
  locked = false,
  verdict,
  onDoubleTap,
  onLongPress,
  onExpand,
  badgeNumber,
}: {
  option: SquircleTileOption;
  onTap: () => void;
  glow?: ReturnType<typeof useTransform<number, number>>;
  hasVoted: boolean;
  chosen: boolean;
  pct?: number;
  fill?: boolean;
  className?: string;
  /** Optional ring color override for the chosen tile (e.g. green/red for Play mode). */
  resultTint?: string;
  /** Disables the tile entirely (e.g. Play mode after the correct/incorrect reveal). Preference votes stay tappable - hasVoted only controls showing results. */
  locked?: boolean;
  /** "Winning"/"Tied" badge - only meaningful once results are visible (hasVoted). */
  verdict?: VerdictState;
  /**
   * Fires on a double-tap. Only wired up once this tile is both voted and
   * chosen - before that, a single tap already means "vote," so a second
   * tap can't be safely reinterpreted without delaying the vote itself.
   */
  onDoubleTap?: () => void;
  /** Fires on a ~500ms press-and-hold that doesn't turn into a drag/vote-swipe. */
  onLongPress?: () => void;
  /** Fires on a tap of the explicit expand button - the discoverable, no-wait alternative to onLongPress. */
  onExpand?: () => void;
  /** Small "1"/"2"/... label in the corner, reinforcing this is a system rather than a photo pair. */
  badgeNumber?: number;
}) {
  const [heartBurst, setHeartBurst] = useState(0);
  const lastTapAt = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const longPressFired = useRef(false);

  const canDoubleTap = hasVoted && chosen && !!onDoubleTap;

  const handleClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (canDoubleTap) {
      const now = Date.now();
      if (now - lastTapAt.current < DOUBLE_TAP_MS) {
        lastTapAt.current = 0;
        setHeartBurst((n) => n + 1);
        onDoubleTap?.();
        return;
      }
      lastTapAt.current = now;
    }
    onTap();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onLongPress) return;
    const t = e.touches[0];
    pressStart.current = { x: t.clientX, y: t.clientY };
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      pressStart.current = null;
      onLongPress();
    }, LONG_PRESS_MS);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    pressStart.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const s = pressStart.current;
    if (!s) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - s.x) > LONG_PRESS_MOVE_TOLERANCE || Math.abs(t.clientY - s.y) > LONG_PRESS_MOVE_TOLERANCE) {
      cancelLongPress();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-disabled={locked}
      onClick={locked ? undefined : handleClick}
      onKeyDown={(e) => {
        if (!locked && (e.key === "Enter" || e.key === " ")) handleClick();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={cancelLongPress}
      whileTap={locked ? undefined : { scale: 0.94 }}
      className={clsx(
        "relative w-full overflow-hidden rounded-xl",
        fill ? "h-full" : "aspect-square",
        !option.imageUrl && "text-tile",
        className
      )}
    >
      {option.imageUrl ? (
        <Image src={option.imageUrl} alt={option.label} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
          {option.claimant && <Avatar name={option.claimant.username} src={option.claimant.avatarUrl} size={36} />}
          <span
            className="line-clamp-3 text-lg font-extrabold leading-tight tracking-tight text-white"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
          >
            {option.claimant ? `@${option.claimant.username}` : option.label}
          </span>
          {option.statement && (
            <span className="line-clamp-3 text-xs font-medium text-white/85">&ldquo;{option.statement}&rdquo;</span>
          )}
          {hasVoted && pct !== undefined && (
            <span className="text-2xl font-black text-white">
              <AnimatedNumber value={pct} />%
            </span>
          )}
        </div>
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
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{ boxShadow: `inset 0 0 0 4px ${resultTint ?? "#ffffff"}` }}
          />
        )}
      </AnimatePresence>
      {badgeNumber !== undefined && (
        <span className="absolute bottom-2.5 left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-[11px] font-bold text-white/90 backdrop-blur-sm">
          {badgeNumber}
        </span>
      )}
      {option.imageUrl && onExpand && (
        <span
          role="button"
          tabIndex={0}
          aria-label="View full screen"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onExpand();
            }
          }}
          className="tap-scale absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white/90 backdrop-blur-sm"
        >
          <ExpandIcon size={14} />
        </span>
      )}
      <VerdictBadge state={hasVoted ? verdict : undefined} />
      <AnimatePresence>
        {heartBurst > 0 && (
          <motion.span
            key={heartBurst}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.3, 1.1, 1.1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, times: [0, 0.35, 0.7, 1] }}
            onAnimationComplete={() => setHeartBurst(0)}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <HeartIcon size={64} filled className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
