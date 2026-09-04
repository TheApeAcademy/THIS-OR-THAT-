"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Avatar } from "@/components/ui/Avatar";
import { Feed } from "@/components/Feed";
import type { ComparisonCardData } from "@/components/ComparisonCard";
import { searchUsersAction, type UserSearchResult } from "@/lib/actions/users";
import { searchComparisonsAction, searchTopicsAction, clearSearchHistoryAction, type TopicSearchResult } from "@/lib/actions/search";

export interface TopicWithFollow {
  id: string;
  slug: string;
  label: string;
  followerCount: number;
  followedByMe: boolean;
}

type Tab = "debates" | "people" | "topics";

const TABS: { id: Tab; label: string }[] = [
  { id: "debates", label: "Debates" },
  { id: "people", label: "People" },
  { id: "topics", label: "Topics" },
];

export function SearchBar({
  myUsername,
  initialTrending,
  initialTopics,
  initialHistory,
}: {
  myUsername: string | null;
  initialTrending: ComparisonCardData[];
  initialTopics: TopicWithFollow[];
  initialHistory: string[];
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("debates");
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState(initialHistory);

  const [debates, setDebates] = useState<ComparisonCardData[]>([]);
  const [people, setPeople] = useState<UserSearchResult[]>([]);
  const [topics, setTopics] = useState<TopicSearchResult[]>([]);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  useEffect(() => {
    if (!searching) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const [d, p, t] = await Promise.all([
          searchComparisonsAction(trimmed),
          searchUsersAction(trimmed),
          searchTopicsAction(trimmed),
        ]);
        setDebates(d);
        setPeople(p);
        setTopics(t);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [trimmed, searching]);

  const counts = useMemo(
    () => ({ debates: debates.length, people: people.length, topics: topics.length }),
    [debates, people, topics]
  );

  return (
    <div className="space-y-5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search debates, people, topics…"
        className="w-full rounded-full border border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent"
        autoFocus
      />

      {!searching && (
        <>
          <RecentSearches
            history={history}
            onPick={(q) => setQuery(q)}
            onClear={() => {
              setHistory([]);
              clearSearchHistoryAction().catch(() => {});
            }}
          />
          <TrendingSection trending={initialTrending} />
          <TopicChips topics={initialTopics} />
        </>
      )}

      {searching && (
        <>
          <div className="flex gap-1 rounded-lg bg-surface p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "tap-scale flex-1 rounded-md py-2 text-sm font-semibold",
                  tab === t.id ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-secondary"
                )}
              >
                {t.label}
                {counts[t.id] > 0 ? ` · ${counts[t.id]}` : ""}
              </button>
            ))}
          </div>

          {isPending && <p className="py-6 text-center text-sm text-text-secondary">Searching…</p>}

          {!isPending && tab === "debates" && (
            <div className="-mx-4">
              {debates.length === 0 ? (
                <EmptyResult label="debates" />
              ) : (
                <Feed initialComparisons={debates} />
              )}
            </div>
          )}

          {!isPending && tab === "people" && (
            <div className="space-y-2">
              {people.length === 0 ? (
                <EmptyResult label="people" />
              ) : (
                people.map((p) => (
                  <Link
                    key={p.username}
                    href={myUsername ? `/compare/${p.username}/${myUsername}` : "/login"}
                    className="tap-scale flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3"
                  >
                    <Avatar name={p.username} src={p.avatarUrl} size={36} />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{p.displayName || p.username}</p>
                      <p className="text-xs text-text-secondary">@{p.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {!isPending && tab === "topics" && (
            <div className="flex flex-wrap gap-2">
              {topics.length === 0 ? (
                <EmptyResult label="topics" />
              ) : (
                topics.map((t) => <TopicChip key={t.id} topic={t} />)
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyResult({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-text-secondary">No {label} found.</p>;
}

function RecentSearches({
  history,
  onPick,
  onClear,
}: {
  history: string[];
  onPick: (query: string) => void;
  onClear: () => void;
}) {
  if (history.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-secondary">Recent searches</p>
        <button onClick={onClear} className="text-xs font-medium text-text-secondary underline">
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="tap-scale rounded-full border border-border px-3 py-1.5 text-sm font-medium text-text-secondary"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrendingSection({ trending }: { trending: ComparisonCardData[] }) {
  if (trending.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-secondary">🔥 Trending now</p>
      <div className="-mx-4">
        <Feed initialComparisons={trending} />
      </div>
    </div>
  );
}

function TopicChips({ topics }: { topics: TopicWithFollow[] }) {
  if (topics.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-secondary">Popular topics</p>
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <TopicChip key={t.id} topic={t} />
        ))}
      </div>
    </div>
  );
}

function TopicChip({ topic }: { topic: TopicWithFollow }) {
  return (
    <Link
      href={`/topic/${topic.slug}`}
      className={clsx(
        "tap-scale rounded-full border px-3 py-1.5 text-sm font-medium",
        topic.followedByMe ? "border-accent bg-accent text-accent-contrast" : "border-border text-text-secondary"
      )}
    >
      #{topic.label}
    </Link>
  );
}
