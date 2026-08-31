"use client";

import Image from "next/image";
import { clsx } from "clsx";
import { AnimatePresence, motion, useTransform } from "framer-motion";
import { gradientForLabel, letterForLabel } from "@/lib/tileArt";

export interface SquircleTileOption {
  id: string;
  label: string;
  imageUrl: string | null;
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
}) {
  return (
    <motion.button
      onClick={onTap}
      disabled={hasVoted}
      whileTap={hasVoted ? undefined : { scale: 0.94 }}
      className={clsx(
        "relative w-full overflow-hidden rounded-2xl",
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
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: `inset 0 0 0 4px ${resultTint ?? "#ffffff"}` }}
          />
        )}
      </AnimatePresence>
      {hasVoted && pct !== undefined && (
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
