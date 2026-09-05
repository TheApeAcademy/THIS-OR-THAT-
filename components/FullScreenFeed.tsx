"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FeedSlide } from "@/components/FeedSlide";
import { Button } from "@/components/ui/Button";
import { SparkleIcon } from "@/components/ui/icons";
import { voteWithOfflineSupport } from "@/lib/voteWithOfflineSupport";
import { buzz, HAPTIC } from "@/lib/haptics";
import type { FeedComparisonData } from "@/lib/feedComparisons";

const PULL_THRESHOLD = 64;
const PULL_MAX = 96;

export function FullScreenFeed({
  initialComparisons,
  viewerId = null,
  onRefresh,
}: {
  initialComparisons: FeedComparisonData[];
  viewerId?: string | null;
  /** When provided, enables pull-to-refresh at the top of the feed. */
  onRefresh?: () => Promise<FeedComparisonData[]>;
}) {
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onRefresh || refreshing) return;
    const dragging = scrollRef.current?.scrollTop === 0;
    touchStartY.current = dragging ? e.touches[0].clientY : null;
    setIsDragging(dragging);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(delta * 0.5, PULL_MAX));
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null) {
      setIsDragging(false);
      return;
    }
    touchStartY.current = null;
    setIsDragging(false);
    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      setRefreshing(true);
      buzz(HAPTIC.confirm);
      onRefresh()
        .then((fresh) => setComparisons(fresh))
        .finally(() => {
          setRefreshing(false);
          setPullDistance(0);
        });
    } else {
      setPullDistance(0);
    }
  };

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
        await voteWithOfflineSupport(comparisonId, optionId);
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
    <div className="relative h-full">
      {onRefresh && (pullDistance > 0 || refreshing) && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center"
          style={{ height: PULL_THRESHOLD }}
        >
          <motion.div
            animate={{ opacity: refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1) }}
            className="mt-3 flex h-8 w-8 items-center justify-center rounded-full glass"
          >
            <motion.span
              className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent"
              animate={refreshing ? { rotate: 360 } : { rotate: (pullDistance / PULL_THRESHOLD) * 360 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: "linear" } : { duration: 0 }}
            />
          </motion.div>
        </div>
      )}
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto"
        style={{
          scrollSnapType: "y mandatory",
          overscrollBehaviorY: "contain",
          transform: pullDistance || refreshing ? `translateY(${refreshing ? PULL_THRESHOLD : pullDistance}px)` : undefined,
          transition: isDragging ? undefined : "transform 0.25s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
    </div>
  );
}
