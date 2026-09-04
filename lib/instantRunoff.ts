export interface Ballot {
  voterSeq: number;
  optionId: string;
  rank: number;
}

export interface RunoffOptionCount {
  optionId: string;
  votes: number;
  eliminated: boolean;
}

export interface RunoffRound {
  round: number;
  counts: RunoffOptionCount[];
  winnerOptionId: string | null;
}

/** Standard instant-runoff: each round, eliminate the option with the fewest current first-choice votes among voters whose ballot still has an active option, until one option has a majority or only one remains. */
export function computeInstantRunoff(ballots: Ballot[]): RunoffRound[] {
  const byVoter = new Map<number, { optionId: string; rank: number }[]>();
  for (const b of ballots) {
    const list = byVoter.get(b.voterSeq) ?? [];
    list.push({ optionId: b.optionId, rank: b.rank });
    byVoter.set(b.voterSeq, list);
  }
  for (const list of byVoter.values()) list.sort((a, b) => a.rank - b.rank);

  const active = new Set(ballots.map((b) => b.optionId));
  const rounds: RunoffRound[] = [];
  let roundNum = 1;

  while (active.size > 0) {
    const counts = new Map<string, number>();
    for (const id of active) counts.set(id, 0);

    let totalVotes = 0;
    for (const list of byVoter.values()) {
      const firstActive = list.find((v) => active.has(v.optionId));
      if (firstActive) {
        counts.set(firstActive.optionId, (counts.get(firstActive.optionId) ?? 0) + 1);
        totalVotes++;
      }
    }

    const countsArr: RunoffOptionCount[] = [...counts.entries()].map(([optionId, votes]) => ({
      optionId,
      votes,
      eliminated: false,
    }));

    const majority = countsArr.find((c) => totalVotes > 0 && c.votes * 2 > totalVotes);

    if (majority || active.size === 1) {
      rounds.push({
        round: roundNum,
        counts: countsArr,
        winnerOptionId: majority?.optionId ?? countsArr[0]?.optionId ?? null,
      });
      break;
    }

    let minVotes = Infinity;
    let minId: string | null = null;
    for (const c of countsArr) {
      if (c.votes < minVotes) {
        minVotes = c.votes;
        minId = c.optionId;
      }
    }

    rounds.push({
      round: roundNum,
      counts: countsArr.map((c) => (c.optionId === minId ? { ...c, eliminated: true } : c)),
      winnerOptionId: null,
    });

    if (minId) active.delete(minId);
    roundNum++;
  }

  return rounds;
}
