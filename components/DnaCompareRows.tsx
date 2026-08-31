import { ProgressBar } from "@/components/ui/ProgressBar";

export interface DnaCompareRow {
  slug: string;
  label: string;
  emoji: string | null;
  pct_a: number;
  pct_b: number;
}

export function DnaCompareRows({
  rows,
  labelA,
  labelB,
}: {
  rows: DnaCompareRow[];
  labelA: string;
  labelB: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-text-secondary">No shared interests yet.</p>;
  }
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.slug}>
          <p className="mb-1 text-sm font-medium text-text-primary">
            {row.emoji} {row.label}
          </p>
          <div className="space-y-1">
            <Row label={`@${labelA}`} pct={row.pct_a} color="var(--accent)" />
            <Row label={`@${labelB}`} pct={row.pct_b} color="var(--accent-2)" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <span className="w-20 shrink-0 truncate">{label}</span>
      <ProgressBar percentage={pct} color={color} />
      <span className="w-10 shrink-0 text-right">{pct}%</span>
    </div>
  );
}
