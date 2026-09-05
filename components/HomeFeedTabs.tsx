"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { FullScreenFeed } from "@/components/FullScreenFeed";
import {
  getForYouFeedAction,
  getFollowingFeedAction,
  getLatestFeedAction,
  getTrendingFeedAction,
} from "@/lib/actions/homeFeed";
import type { FeedComparisonData } from "@/lib/feedComparisons";

const FETCHERS = {
  forYou: getForYouFeedAction,
  following: getFollowingFeedAction,
  latest: getLatestFeedAction,
  trending: getTrendingFeedAction,
} as const;

type Tab = "forYou" | "following" | "latest" | "trending";

const TABS: { key: Tab; label: string }[] = [
  { key: "forYou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "latest", label: "Latest" },
  { key: "trending", label: "Trending" },
];

export function HomeFeedTabs({
  forYouCards,
  viewerId,
}: {
  forYouCards: FeedComparisonData[];
  viewerId: string | null;
}) {
  const [tab, setTab] = useState<Tab>("forYou");
  const [cache, setCache] = useState<Partial<Record<Tab, FeedComparisonData[]>>>({ forYou: forYouCards });
  const [isPending, startTransition] = useTransition();

  const selectTab = (next: Tab) => {
    setTab(next);
    if (cache[next]) return;
    startTransition(async () => {
      const data = await FETCHERS[next]();
      setCache((prev) => ({ ...prev, [next]: data }));
    });
  };

  const refreshActiveTab = async () => {
    const data = await FETCHERS[tab]();
    setCache((prev) => ({ ...prev, [tab]: data }));
    return data;
  };

  const cards = cache[tab];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 gap-1 overflow-x-auto px-4 pb-2 pt-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTab(t.key)}
            className={clsx(
              "tap-scale shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-accent-soft text-accent" : "text-text-secondary"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1">
        {cards === undefined ? (
          <div className="flex h-full items-center justify-center text-sm text-text-secondary">
            {isPending ? "Loading…" : ""}
          </div>
        ) : (
          <FullScreenFeed key={tab} initialComparisons={cards} viewerId={viewerId} onRefresh={refreshActiveTab} />
        )}
      </div>
    </div>
  );
}
