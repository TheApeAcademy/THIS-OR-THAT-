"use client";

import { useState, useTransition } from "react";
import { FeedSlide } from "@/components/FeedSlide";
import { voteAction } from "@/lib/actions/vote";
import type { FeedComparisonData } from "@/lib/feedComparisons";

export function FullScreenFeed({ initialComparisons }: { initialComparisons: FeedComparisonData[] }) {
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [, startTransition] = useTransition();

  const handleVote = (comparisonId: string, optionId: string) => {
    const alreadyVoted = comparisons.find((c) => c.id === comparisonId)?.votedOptionId;
    if (alreadyVoted) return;

    setComparisons((prev) =>
      prev.map((c) => {
        if (c.id !== comparisonId || c.votedOptionId) return c;
        return {
          ...c,
          votedOptionId: optionId,
          optionA: c.optionA.id === optionId ? { ...c.optionA, voteCount: c.optionA.voteCount + 1 } : c.optionA,
          optionB: c.optionB.id === optionId ? { ...c.optionB, voteCount: c.optionB.voteCount + 1 } : c.optionB,
        };
      })
    );

    startTransition(async () => {
      try {
        await voteAction(comparisonId, optionId);
      } catch {
        // Roll back so the user can retry instead of losing the whole feed.
        setComparisons((prev) =>
          prev.map((c) => {
            if (c.id !== comparisonId || c.votedOptionId !== optionId) return c;
            return {
              ...c,
              votedOptionId: null,
              optionA:
                c.optionA.id === optionId ? { ...c.optionA, voteCount: c.optionA.voteCount - 1 } : c.optionA,
              optionB:
                c.optionB.id === optionId ? { ...c.optionB, voteCount: c.optionB.voteCount - 1 } : c.optionB,
            };
          })
        );
      }
    });
  };

  if (comparisons.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <p className="text-xl font-semibold text-text-primary">Nothing here yet</p>
        <p className="text-text-secondary">Be the first to create a comparison.</p>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ scrollSnapType: "y mandatory", overscrollBehaviorY: "contain" }}
    >
      {comparisons.map((comparison) => (
        <FeedSlide
          key={comparison.id}
          comparison={comparison}
          onVote={(optionId) => handleVote(comparison.id, optionId)}
        />
      ))}
    </div>
  );
}
