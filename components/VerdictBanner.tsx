"use client";

import { motion } from "framer-motion";
import { TrophyIcon, ScaleIcon } from "@/components/ui/icons";
import { SPRING_BOUNCY } from "@/lib/motion";
import { computeVerdict } from "@/lib/verdict";

const CONFETTI_COLORS = [
  "var(--accent)",
  "var(--accent-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

// The big "it's over" moment for a time-boxed comparison once its deadline
// has passed — replaces the countdown chip. Shown to everyone regardless
// of whether they voted, since the result is now public/final, like a
// closed poll.
export function VerdictBanner({
  options,
}: {
  options: { id: string; label: string; voteCount: number }[];
}) {
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const { winnerIds, isTie, hasVotes } = computeVerdict(options);

  if (!hasVotes) {
    return (
      <div className="mb-2 rounded-2xl bg-surface px-4 py-2.5 text-sm font-bold text-text-secondary">
        🏁 FINAL — no one voted in time
      </div>
    );
  }

  const winnerLabel = options.find((o) => o.id === winnerIds[0])?.label ?? "";
  const winnerPct = total > 0 ? Math.round(((options.find((o) => o.id === winnerIds[0])?.voteCount ?? 0) / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.4, rotate: -15 }}
      animate={{ opacity: 1, scale: 1, rotate: -3 }}
      transition={SPRING_BOUNCY}
      className="relative mb-2 overflow-hidden rounded-2xl px-4 py-3"
      style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)" }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{
                opacity: 0,
                x: Math.cos(angle) * 70,
                y: Math.sin(angle) * 70,
                scale: 0.4,
              }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
              style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
            />
          );
        })}
      </div>
      <p className="relative flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/80">
        {isTie ? <ScaleIcon size={13} /> : <TrophyIcon size={13} />}
        Final result
      </p>
      <p className="relative mt-0.5 text-base font-black text-white">
        {isTie ? "It's a tie!" : `${winnerLabel} wins with ${winnerPct}%`}
      </p>
    </motion.div>
  );
}
