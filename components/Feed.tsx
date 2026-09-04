"use client";

import { useState, useTransition } from "react";
import { ComparisonCard, type ComparisonCardData } from "@/components/ComparisonCard";
import { voteAction } from "@/lib/actions/vote";

export function Feed({ initialComparisons }: { initialComparisons: ComparisonCardData[] }) {
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [, startTransition] = useTransition();

  const handleVote = (comparisonId: string, optionId: string) => {
    const current = comparisons.find((c) => c.id === comparisonId);
    if (!current || current.votedOptionId === optionId) return;
    const previousOptionId = current.votedOptionId ?? null;

    const applyChange = (from: string | null, to: string | null) =>
      setComparisons((prev) =>
        prev.map((c) => {
          if (c.id !== comparisonId) return c;
          return {
            ...c,
            votedOptionId: to,
            options: c.options.map((o) => {
              let voteCount = o.voteCount;
              if (o.id === from) voteCount = Math.max(voteCount - 1, 0);
              if (o.id === to) voteCount += 1;
              return voteCount === o.voteCount ? o : { ...o, voteCount };
            }),
          };
        })
      );

    applyChange(previousOptionId, optionId);

    startTransition(async () => {
      try {
        await voteAction(comparisonId, optionId);
      } catch {
        applyChange(optionId, previousOptionId);
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
