"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Feed } from "@/components/Feed";
import { Tabs } from "@/components/ui/Tabs";
import type { ComparisonCardData } from "@/components/ComparisonCard";
import { searchUsersAction, type UserSearchResult } from "@/lib/actions/users";
import {
  searchComparisonsAction,
  searchTopicsAction,
  recordSearchAction,
  clearSearchHistoryAction,
  type TopicSearchResult,
} from "@/lib/actions/search";

const TABS = [
  { value: "debates", label: "Debates" },
  { value: "people", label: "People" },
  { value: "topics", label: "Topics" },
];

export function SearchPanel({
  myUsername,
  initialTrendingCards,
  initialPopularTopics,
  initialRecentSearches,
}: {
  myUsername: string | null;
  initialTrendingCards: ComparisonCardData[];
  initialPopularTopics: TopicSearchResult[];
  initialRecentSearches: string[];
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("debates");
  const [comparisons, setComparisons] = useState<ComparisonCardData[]>([]);
  const [people, setPeople] = useState<UserSearchResult[]>([]);
  const [topics, setTopics] = useState<TopicSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState(initialRecentSearches);
  const [isPending, startTransition] = useTransition();
  const latestQueryRef = useRef("");
  const recordedRef = useRef<Set<string>>(new Set());

  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;

  useEffect(() => {
    if (!isSearching) return;

    const timer = setTimeout(() => {
      latestQueryRef.current = trimmed;
      startTransition(async () => {
        const [foundComparisons, foundPeople, foundTopics] = await Promise.all([
          searchComparisonsAction(trimmed),
          searchUsersAction(trimmed),
          searchTopicsAction(trimmed),
        ]);
        if (latestQueryRef.current !== trimmed) return;
        setComparisons(foundComparisons);
        setPeople(foundPeople);
        setTopics(foundTopics);
      });

      if (!recordedRef.current.has(trimmed.toLowerCase())) {
        recordedRef.current.add(trimmed.toLowerCase());
        recordSearchAction(trimmed).catch(() => {});
        setRecentSearches((prev) => [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8));
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [trimmed, isSearching]);

  const clearHistory = () => {
    setRecentSearches([]);
    clearSearchHistoryAction().catch(() => {});
  };

  const resultCount = useMemo(
    () => (tab === "debates" ? comparisons.length : tab === "people" ? people.length : topics.length),
    [tab, comparisons.length, people.length, topics.length]
  );

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search debates, people, or topics"
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />

      {!isSearching && (
        <div className="space-y-6">
          {recentSearches.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-text-secondary">Recent searches</p>
                <button type="button" onClick={clearHistory} className="text-xs font-semibold text-accent">
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuery(q)}
                    className="tap-scale rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {initialPopularTopics.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-text-secondary">Popular topics</p>
              <div className="flex flex-wrap gap-2">
                {initialPopularTopics.map((t) => (
                  <Link
                    key={t.id}
                    href={`/topic/${t.slug}`}
                    className="tap-scale rounded-full border border-border px-3 py-1.5 text-sm font-medium text-text-secondary"
                  >
                    {t.label} <span className="opacity-70">· {t.followerCount}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-text-secondary">Trending debates</p>
            {initialTrendingCards.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">Nothing trending yet.</p>
            ) : (
              <div className="-mx-4">
                <Feed initialComparisons={initialTrendingCards} />
              </div>
            )}
          </div>
        </div>
      )}

      {isSearching && (
        <div className="space-y-4">
          <Tabs options={TABS} value={tab} onChange={setTab} />

          {isPending && <p className="text-sm text-text-secondary">Searching…</p>}

          {!isPending && resultCount === 0 && (
            <p className="py-8 text-center text-sm text-text-secondary">No results for &ldquo;{trimmed}&rdquo;.</p>
          )}

          {!isPending && tab === "debates" && comparisons.length > 0 && (
            <div className="-mx-4">
              <Feed initialComparisons={comparisons} />
            </div>
          )}

          {!isPending && tab === "people" && people.length > 0 && (
            <div className="space-y-2">
              {people.map((p) => (
                <Link
                  key={p.id}
                  href={myUsername ? `/compare/${p.username}/${myUsername}` : "/login"}
                  className="tap-scale flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3"
                >
                  <Avatar name={p.username} src={p.avatarUrl} size={36} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{p.displayName || p.username}</p>
                    <p className="text-xs text-text-secondary">@{p.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!isPending && tab === "topics" && topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <Link
                  key={t.id}
                  href={`/topic/${t.slug}`}
                  className="tap-scale rounded-full border border-border px-3 py-1.5 text-sm font-medium text-text-secondary"
                >
                  {t.label} <span className="opacity-70">· {t.followerCount}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
