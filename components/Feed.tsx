"use client";

import { useState, useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { voteAction } from "@/lib/actions/vote";

export function Feed({ initialComparisons }: { initialComparisons: ComparisonCardData[] }) {
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [, startTransition] = useTransition();

  const handleVote = (comparisonId: string, optionId: string) => {
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
      await voteAction(comparisonId, optionId);
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
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      {comparisons.map((comparison) => (
        <ComparisonCard
          key={comparison.id}
          comparison={comparison}
          onVote={(optionId) => handleVote(comparison.id, optionId)}
        />
      ))}
    </div>
  );
}
