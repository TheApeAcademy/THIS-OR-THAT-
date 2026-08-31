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

  const applyVote = (comparisonId: string, optionId: string, delta: 1 | -1) => {
    setComparisons((prev) =>
      prev.map((c) => {
        if (c.id !== comparisonId) return c;
        return {
          ...c,
          votedOptionId: delta === 1 ? optionId : null,
          options: c.options.map((o) =>
            o.id === optionId ? { ...o, voteCount: o.voteCount + delta } : o
          ),
        };
      })
    );
  };

  const handleVote = (comparisonId: string, optionId: string) => {
    const alreadyVoted = comparisons.find((c) => c.id === comparisonId)?.votedOptionId;
    if (alreadyVoted) return;

    applyVote(comparisonId, optionId, 1);

    startTransition(async () => {
      try {
        await voteAction(comparisonId, optionId);
      } catch {
        // Roll back so the user can retry instead of losing the whole feed.
        applyVote(comparisonId, optionId, -1);
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
