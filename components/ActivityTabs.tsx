"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { Feed } from "@/components/Feed";
import type { ComparisonCardData } from "@/components/ComparisonCard";

const OPTIONS = [
  { value: "notifications", label: "Notifications" },
  { value: "recent", label: "Recently viewed" },
];

export function ActivityTabs({
  notifications,
  recentlyViewed,
}: {
  notifications: ReactNode;
  recentlyViewed: ComparisonCardData[];
}) {
  const [tab, setTab] = useState("notifications");

  return (
    <div className="space-y-4">
      <Tabs options={OPTIONS} value={tab} onChange={setTab} />

      {tab === "notifications" && notifications}

      {tab === "recent" &&
        (recentlyViewed.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <p className="text-lg font-semibold text-text-primary">Nothing viewed yet</p>
            <p className="text-sm text-text-secondary">Debates you open will show up here.</p>
          </div>
        ) : (
          <div className="-mx-4">
            <Feed initialComparisons={recentlyViewed} />
          </div>
        ))}
    </div>
  );
}
