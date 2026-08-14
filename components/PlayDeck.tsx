"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { voteAction } from "@/lib/actions/vote";
import { Button } from "@/components/ui/Button";
import { SwipeDeck } from "@/components/SwipeDeck";
import type { RawComparisonWithOptions } from "@/lib/comparisons";

export function PlayDeck({ comparisons }: { comparisons: RawComparisonWithOptions[] }) {
  const [queue] = useState(comparisons);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const current = queue[index];

  const handleVote = (comparisonId: string, optionId: string) => {
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

  const deckItems = queue
    .map((c) => {
      const optionA = c.comparison_options.find((o) => o.side === "a");
      const optionB = c.comparison_options.find((o) => o.side === "b");
      if (!optionA || !optionB) return null;
      return { id: c.id, optionA, optionB };
    })
    .filter((item) => item !== null);

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
      <SwipeDeck queue={deckItems} index={index} onVote={handleVote} />
      <p className="text-center text-xs text-text-secondary">
        Swipe left for {current.comparison_options.find((o) => o.side === "a")?.label} · Swipe right for{" "}
        {current.comparison_options.find((o) => o.side === "b")?.label}
      </p>
    </div>
  );
}
