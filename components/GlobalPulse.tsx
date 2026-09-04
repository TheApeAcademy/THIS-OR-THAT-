export interface GlobalPulseRow {
  country: string;
  option_id: string;
  votes: number;
}

export function GlobalPulse({
  rows,
  options,
}: {
  rows: GlobalPulseRow[];
  options: { id: string; label: string }[];
}) {
  if (rows.length === 0) return null;

  const labelFor = (id: string) => options.find((o) => o.id === id)?.label ?? "?";

  const byCountry = new Map<string, GlobalPulseRow[]>();
  for (const r of rows) {
    const list = byCountry.get(r.country) ?? [];
    list.push(r);
    byCountry.set(r.country, list);
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="mb-2 text-sm font-semibold text-text-secondary">🌍 Global Pulse</p>
      <div className="space-y-2">
        {[...byCountry.entries()].map(([country, opts]) => {
          const total = opts.reduce((sum, o) => sum + o.votes, 0);
          const top = [...opts].sort((a, b) => b.votes - a.votes)[0];
          const pct = total > 0 ? Math.round((top.votes / total) * 100) : 0;
          return (
            <div key={country} className="flex items-center justify-between text-sm">
              <span className="text-text-primary">{country}</span>
              <span className="text-text-secondary">
                {labelFor(top.option_id)} <span className="font-semibold text-text-primary">{pct}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
