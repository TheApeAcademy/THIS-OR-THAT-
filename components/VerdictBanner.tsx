"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrophyIcon, ScaleIcon } from "@/components/ui/icons";
import { Confetti } from "@/components/ui/Confetti";
import { SPRING_BOUNCY } from "@/lib/motion";
import { computeVerdict } from "@/lib/verdict";
import { createRematchAction } from "@/lib/actions/createComparison";
import { buzz } from "@/lib/haptics";

// The big "it's over" moment for a time-boxed comparison once its deadline
// has passed — replaces the countdown chip. Shown to everyone regardless
// of whether they voted, since the result is now public/final, like a
// closed poll.
export function VerdictBanner({
  comparisonId,
  options,
}: {
  comparisonId: string;
  options: { id: string; label: string; voteCount: number }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rematchId, setRematchId] = useState<string | null>(null);
  const total = options.reduce((sum, o) => sum + o.voteCount, 0);
  const { winnerIds, isTie, hasVotes } = computeVerdict(options);

  const runItBack = () => {
    buzz(14);
    startTransition(async () => {
      try {
        const id = await createRematchAction(comparisonId);
        setRematchId(id);
        router.push(`/comparison/${id}`);
      } catch {
        // Not authenticated (or another failure) — send guests to log in;
        // for a signed-in user this is a rare/transient failure, safe to
        // just leave the button re-enabled for another try.
        router.push("/login");
      }
    });
  };

  const rematchLabel = isPending ? "Starting…" : rematchId ? "View rematch →" : "Run it back 🔁";

  if (!hasVotes) {
    return (
      <div className="mb-2 space-y-1.5 rounded-2xl bg-surface px-4 py-2.5">
        <p className="text-sm font-bold text-text-secondary">🏁 FINAL — no one voted in time</p>
        <button
          type="button"
          onClick={runItBack}
          disabled={isPending}
          className="tap-scale rounded-full border border-border px-3 py-1 text-xs font-bold text-text-primary disabled:opacity-60"
        >
          {rematchLabel}
        </button>
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
      <Confetti />
      <p className="relative flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/80">
        {isTie ? <ScaleIcon size={13} /> : <TrophyIcon size={13} />}
        Final result
      </p>
      <p className="relative mt-0.5 text-base font-black text-white">
        {isTie ? "It's a tie!" : `${winnerLabel} wins with ${winnerPct}%`}
      </p>
      <button
        type="button"
        onClick={runItBack}
        disabled={isPending}
        className="tap-scale relative mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
      >
        {rematchLabel}
      </button>
    </motion.div>
  );
}
