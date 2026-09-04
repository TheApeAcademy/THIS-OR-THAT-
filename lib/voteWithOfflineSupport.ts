"use client";

import { voteAction } from "@/lib/actions/vote";
import { queueVote } from "@/lib/offlineVoteQueue";

/**
 * Casts a vote, or — when there's no connection — queues it for the next
 * `online` event instead of failing outright. Callers keep their existing
 * optimistic UI in the offline case (this resolves normally); a real
 * server-side error (not connectivity) still rejects so the caller can
 * roll its optimistic update back.
 */
export async function voteWithOfflineSupport(comparisonId: string, optionId: string): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueVote(comparisonId, optionId);
    return;
  }

  try {
    await voteAction(comparisonId, optionId);
  } catch (e) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      queueVote(comparisonId, optionId);
      return;
    }
    throw e;
  }
}
