export interface PickRow {
  comparisonId: string;
  chosenLabel: string;
  otherLabel: string;
}

export function RecentPicks({ picks }: { picks: PickRow[] }) {
  if (picks.length === 0) return null;

  return (
    <div className="space-y-2">
      {picks.map((pick) => (
        <div
          key={pick.comparisonId}
          className="flex items-center justify-between rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
        >
          <span className="font-semibold text-text-primary">{pick.chosenLabel}</span>
          <span className="text-text-secondary">over</span>
          <span className="text-text-secondary">{pick.otherLabel}</span>
        </div>
      ))}
    </div>
  );
}
