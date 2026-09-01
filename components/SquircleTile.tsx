"use client";

import Image from "next/image";
import { clsx } from "clsx";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import { VerdictBadge, type VerdictState } from "@/components/VerdictBadge";
import { Avatar } from "@/components/ui/Avatar";

export interface SquircleTileOption {
  id: string;
  label: string;
  imageUrl: string | null;
  /** Set on Duel Mode options — the debater's own point, shown on their tile. */
  statement?: string | null;
  claimant?: { username: string; avatarUrl: string | null } | null;
}

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
  /** Disables the tile entirely (e.g. Play mode after the correct/incorrect reveal). Preference votes stay tappable — hasVoted only controls showing results. */
  locked?: boolean;
  /** "Winning"/"Tied" badge — only meaningful once results are visible (hasVoted). */
  verdict?: VerdictState;
}) {
  return (
    <motion.button
      onClick={onTap}
      disabled={locked}
      whileTap={locked ? undefined : { scale: 0.94 }}
      className={clsx(
        "relative w-full overflow-hidden rounded-2xl",
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
          {hasVoted && pct !== undefined && <span className="text-2xl font-black text-white">{pct}%</span>}
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
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: `inset 0 0 0 4px ${resultTint ?? "#ffffff"}` }}
          />
        )}
      </AnimatePresence>
      {hasVoted && pct !== undefined && option.imageUrl && (
        <motion.span
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.1 }}
          className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white"
        >
          {pct}%
        </motion.span>
      )}
      <VerdictBadge state={hasVoted ? verdict : undefined} />
    </motion.button>
  );
}
