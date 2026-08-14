"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { voteAction } from "@/lib/actions/vote";
import { Button } from "@/components/ui/Button";
import type { RawComparisonWithOptions } from "@/lib/comparisons";

export function PlayDeck({ comparisons }: { comparisons: RawComparisonWithOptions[] }) {
  const [queue] = useState(comparisons);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const current = queue[index];

  const handleVote = (optionId: string) => {
    if (!current) return;
    const comparisonId = current.id;
    startTransition(async () => {
      await voteAction(comparisonId, optionId);
    });
    setStreak((s) => s + 1);
    setIndex((i) => i + 1);
  };

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-2xl font-bold text-text-primary">You&rsquo;re all caught up 🎉</p>
        <p className="text-text-secondary">{streak} comparisons this round.</p>
        <Button onClick={() => router.refresh()}>Play again</Button>
      </div>
    );
  }

  const optionA = current.comparison_options.find((o) => o.side === "a");
  const optionB = current.comparison_options.find((o) => o.side === "b");
  if (!optionA || !optionB) return null;

  return (
    <div
      className="flex h-full flex-col gap-3 px-4 pb-4"
      style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}
    >
      <div className="flex items-center justify-between text-sm font-medium text-text-secondary">
        <span>🔥 {streak}</span>
        <span>
          {index + 1} / {queue.length}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="grid flex-1 grid-rows-2 gap-3"
        >
          {[optionA, optionB].map((option) => (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              className="tap-scale flex items-center justify-center rounded-xl border border-border bg-surface-raised px-6 text-center text-2xl font-bold text-text-primary shadow-sm"
            >
              {option.label}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
