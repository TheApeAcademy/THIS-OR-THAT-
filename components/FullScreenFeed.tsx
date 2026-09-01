"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FeedSlide } from "@/components/FeedSlide";
import { Button } from "@/components/ui/Button";
import { SparkleIcon } from "@/components/ui/icons";
import { voteAction } from "@/lib/actions/vote";
import type { FeedComparisonData } from "@/lib/feedComparisons";

export function FullScreenFeed({
  initialComparisons,
  viewerId = null,
}: {
  initialComparisons: FeedComparisonData[];
  viewerId?: string | null;
}) {
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [, startTransition] = useTransition();

  // Voting is a preference, not a one-shot commitment: newOptionId becomes
  // the vote (null = no vote), previousOptionId (if any) loses it. Handles
  // a first vote (previousOptionId null), a switch (both non-null), and
  // rollback on failure (called again with the two arguments swapped).
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
        // Roll back to exactly the state before this vote attempt.
        applyVote(comparisonId, previousOptionId, optionId);
      }
    });
  };

  if (comparisons.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <SparkleIcon size={26} />
        </div>
        <p className="text-xl font-semibold text-text-primary">Nothing here yet</p>
        <p className="text-text-secondary">Be the first to create a comparison.</p>
        <Link href="/create">
          <Button className="mt-1">Create a comparison</Button>
        </Link>
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
          viewerId={viewerId}
        />
      ))}
    </div>
  );
}
