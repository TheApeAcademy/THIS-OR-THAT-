"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { createCustomFeedAction, deleteCustomFeedAction, type CustomFeedRow } from "@/lib/actions/customFeeds";
import type { FollowedTopic } from "@/lib/actions/topics";

export function CustomFeedManager({
  initialFeeds,
  followedTopics,
}: {
  initialFeeds: CustomFeedRow[];
  followedTopics: FollowedTopic[];
}) {
  const router = useRouter();
  const [feeds, setFeeds] = useState(initialFeeds);
  const [name, setName] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const create = () => {
    setError(null);
    startTransition(async () => {
      try {
        await createCustomFeedAction(name, selectedTopicIds);
        setName("");
        setSelectedTopicIds([]);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't create feed.");
      }
    });
  };

  const remove = (id: string) => {
    setFeeds((prev) => prev.filter((f) => f.id !== id));
    deleteCustomFeedAction(id).catch(() => router.refresh());
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {feeds.length === 0 ? (
          <p className="text-sm text-text-secondary">No custom feeds yet - bundle topics you follow below.</p>
        ) : (
          feeds.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-3">
              <Link href={`/feed/${f.id}`} className="flex-1">
                <p className="text-sm font-semibold text-text-primary">{f.name}</p>
                <p className="text-xs text-text-secondary">{f.topics.map((t) => t.label).join(", ") || "No topics"}</p>
              </Link>
              <button type="button" onClick={() => remove(f.id)} className="tap-scale px-2 text-xs font-semibold text-red-500">
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface-raised p-4">
        <p className="text-sm font-semibold text-text-primary">New feed</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Feed name (e.g. My Cars)"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />

        {followedTopics.length === 0 ? (
          <p className="text-xs text-text-secondary">
            Follow a topic first (from Search or a debate) to bundle it into a feed.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {followedTopics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTopic(t.id)}
                className={clsx(
                  "tap-scale rounded-full border px-3 py-1.5 text-xs font-medium",
                  selectedTopicIds.includes(t.id)
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-border text-text-secondary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="button"
          onClick={create}
          disabled={isPending || !name.trim() || selectedTopicIds.length === 0}
          className="tap-scale w-full rounded-full bg-accent py-2 text-sm font-bold text-accent-contrast disabled:opacity-40"
        >
          Create feed
        </button>
      </div>
    </div>
  );
}
