// Every comparison resolves into a verdict once it has votes: whichever
// option(s) have the most votes are "winning" (or "tied" if more than one
// option shares the top count) - the same rule for a 2-option comparison
// and a 3-6 option one, so callers don't need special-case tie logic per
// option count.
export interface Verdict {
  winnerIds: string[];
  isTie: boolean;
  hasVotes: boolean;
}

export function computeVerdict(options: { id: string; voteCount: number }[]): Verdict {
  const max = Math.max(0, ...options.map((o) => o.voteCount));
  if (max === 0) return { winnerIds: [], isTie: false, hasVotes: false };
  const leaders = options.filter((o) => o.voteCount === max);
  return { winnerIds: leaders.map((o) => o.id), isTie: leaders.length > 1, hasVotes: true };
}
