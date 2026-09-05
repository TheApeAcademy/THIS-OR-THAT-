"use client";

import { useEffect, useState } from "react";
import { voteAction } from "@/lib/actions/vote";
import { flushVoteQueue, getQueuedVoteCount } from "@/lib/offlineVoteQueue";

export function OfflineVoteSync() {
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(() =>
    typeof window === "undefined" ? 0 : getQueuedVoteCount()
  );

  useEffect(() => {
    const flush = async () => {
      if (getQueuedVoteCount() === 0) return;
      setSyncing(true);
      await flushVoteQueue((comparisonId, optionId) => voteAction(comparisonId, optionId));
      setPending(getQueuedVoteCount());
      setSyncing(false);
    };

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  if (!syncing && pending === 0) return null;

  return (
    <div className="glass fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold text-text-secondary shadow-lg">
      {syncing ? "Syncing votes…" : `${pending} vote${pending === 1 ? "" : "s"} waiting to sync`}
    </div>
  );
}
