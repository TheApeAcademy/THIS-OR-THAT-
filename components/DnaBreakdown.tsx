import { ProgressBar } from "@/components/ui/ProgressBar";

export interface DnaRow {
  slug: string;
  label: string;
  emoji: string | null;
  pct: number;
  votes: number;
}

export function DnaBreakdown({ rows }: { rows: DnaRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Vote on a few comparisons to build your Preference DNA.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.slug}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">
              {row.emoji} {row.label}
            </span>
            <span className="text-text-secondary">{row.pct}%</span>
          </div>
          <ProgressBar percentage={row.pct} />
        </div>
      ))}
    </div>
  );
}
