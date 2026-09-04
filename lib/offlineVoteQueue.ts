"use client";

const STORAGE_KEY = "tot:offline-vote-queue";

export interface QueuedVote {
  comparisonId: string;
  optionId: string;
  queuedAt: number;
}

function readQueue(): QueuedVote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedVote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // best-effort — a private-browsing quota error shouldn't crash the app
  }
}

/** Replaces any already-queued vote for the same comparison (last choice wins). */
export function queueVote(comparisonId: string, optionId: string) {
  const queue = readQueue().filter((v) => v.comparisonId !== comparisonId);
  queue.push({ comparisonId, optionId, queuedAt: Date.now() });
  writeQueue(queue);
}

export function getQueuedVoteCount(): number {
  return readQueue().length;
}

/** Replays queued votes via the given sender, dropping ones that succeed. Returns how many synced. */
export async function flushVoteQueue(
  send: (comparisonId: string, optionId: string) => Promise<void>
): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedVote[] = [];
  let synced = 0;
  for (const item of queue) {
    try {
      await send(item.comparisonId, item.optionId);
      synced++;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return synced;
}
