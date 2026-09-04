import type { RankedChoiceLabeledRound } from "@/lib/actions/rankedChoice";

export function RankedChoiceResults({ rounds }: { rounds: RankedChoiceLabeledRound[] }) {
  if (rounds.length === 0) {
    return <p className="py-4 text-center text-sm text-text-secondary">No rankings submitted yet.</p>;
  }

  const finalRound = rounds[rounds.length - 1];
  const winnerLabel = finalRound.counts.find((c) => c.optionId === finalRound.winnerOptionId)?.label;

  return (
    <div className="space-y-4">
      {winnerLabel && (
        <p className="text-center text-sm font-semibold text-accent">🏆 {winnerLabel} wins the runoff</p>
      )}
      <div className="space-y-3">
        {rounds.map((round) => {
          const total = round.counts.reduce((sum, c) => sum + c.votes, 0);
          return (
            <div key={round.round}>
              <p className="mb-1 text-xs font-semibold text-text-secondary">Round {round.round}</p>
              <div className="space-y-1">
                {[...round.counts]
                  .sort((a, b) => b.votes - a.votes)
                  .map((c) => {
                    const pct = total > 0 ? (c.votes / total) * 100 : 0;
                    return (
                      <div key={c.optionId} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={c.eliminated ? "text-text-secondary line-through" : "text-text-primary"}>
                            {c.label}
                          </span>
                          <span className="text-text-secondary">{c.votes}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: c.eliminated ? "var(--text-secondary)" : "var(--accent)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
