"use client";

import { useState, useTransition } from "react";
import { Feed } from "@/components/Feed";
import type { ComparisonCardData } from "@/components/ComparisonCard";
import {
  createCustomFeedAction,
  deleteCustomFeedAction,
  getCustomFeedComparisonsAction,
  type CustomFeedRow,
} from "@/lib/actions/customFeeds";

export interface TopicOption {
  id: string;
  label: string;
}

export function CustomFeedsSection({
  initialFeeds,
  topics,
}: {
  initialFeeds: CustomFeedRow[];
  topics: TopicOption[];
}) {
  const [feeds, setFeeds] = useState(initialFeeds);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cards, setCards] = useState<ComparisonCardData[] | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [name, setName] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const openFeed = (id: string) => {
    setActiveId(id);
    setLoading(true);
    startTransition(async () => {
      const result = await getCustomFeedComparisonsAction(id).catch(() => []);
      setCards(result);
      setLoading(false);
    });
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed || selectedTopics.size === 0) return;
    startTransition(async () => {
      const feed = await createCustomFeedAction(trimmed, [...selectedTopics]).catch(() => null);
      if (feed) {
        setFeeds((prev) => [...prev, feed]);
        setName("");
        setSelectedTopics(new Set());
        setShowNewForm(false);
      }
    });
  };

  const remove = (id: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setCards(null);
    }
    startTransition(() => {
      deleteCustomFeedAction(id).catch(() => {});
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-secondary">My feeds</p>
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="tap-scale text-xs font-semibold text-accent"
        >
          + New feed
        </button>
      </div>

      {showNewForm && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Feed name, e.g. My Cars"
            className="w-full rounded-full border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
          />
          <div className="flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTopic(t.id)}
                className={`tap-scale rounded-full border px-2.5 py-1 text-xs font-medium ${
                  selectedTopics.has(t.id)
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-text-secondary"
                }`}
              >
                #{t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={create}
            disabled={!name.trim() || selectedTopics.size === 0}
            className="tap-scale w-full rounded-full bg-accent py-2 text-sm font-semibold text-accent-contrast disabled:opacity-50"
          >
            Create feed
          </button>
        </div>
      )}

      {feeds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {feeds.map((f) => (
            <div key={f.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openFeed(f.id)}
                className={`tap-scale rounded-full border px-3 py-1.5 text-sm font-medium ${
                  activeId === f.id
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-border text-text-secondary"
                }`}
              >
                {f.name}
              </button>
              {activeId === f.id && (
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="text-xs font-medium text-danger"
                  aria-label={`Delete ${f.name}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeId && (
        <div className="-mx-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-secondary">Loading…</p>
          ) : cards && cards.length > 0 ? (
            <Feed initialComparisons={cards} />
          ) : (
            <p className="py-8 text-center text-sm text-text-secondary">Nothing here yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
