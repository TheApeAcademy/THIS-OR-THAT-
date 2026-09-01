"use client";

import { useState, useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { voteAction } from "@/lib/actions/vote";

export function Feed({ initialComparisons }: { initialComparisons: ComparisonCardData[] }) {
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [, startTransition] = useTransition();

  // Voting is a preference, not a one-shot commitment: newOptionId becomes
  // the vote (null = no vote), previousOptionId (if any) loses it.
  const applyVote = (comparisonId: string, newOptionId: string | null, previousOptionId: string | null) => {
    setComparisons((prev) =>
      prev.map((c) => {
        if (c.id !== comparisonId) return c;
        return {
          ...c,
          votedOptionId: newOptionId,
          options: c.options.map((o) => {
            if (o.id === newOptionId) return { ...o, voteCount: o.voteCount + 1 };
            if (o.id === previousOptionId) return { ...o, voteCount: o.voteCount - 1 };
            return o;
          }),
        };
      })
    );
  };

  const handleVote = (comparisonId: string, optionId: string) => {
    const previousOptionId = comparisons.find((c) => c.id === comparisonId)?.votedOptionId ?? null;
    if (previousOptionId === optionId) return;

    applyVote(comparisonId, optionId, previousOptionId);

    startTransition(async () => {
      try {
        await voteAction(comparisonId, optionId);
      } catch {
        applyVote(comparisonId, previousOptionId, optionId);
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
