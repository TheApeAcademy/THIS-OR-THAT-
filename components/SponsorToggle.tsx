"use client";

import { useState, useTransition } from "react";
import { setSponsoredAction } from "@/lib/actions/admin";

export function SponsorToggle({
  comparisonId,
  initialSponsored,
  initialLabel,
}: {
  comparisonId: string;
  initialSponsored: boolean;
  initialLabel: string | null;
}) {
  const [sponsored, setSponsored] = useState(initialSponsored);
  const [label, setLabel] = useState(initialLabel ?? "");
  const [, startTransition] = useTransition();

  const save = (nextSponsored: boolean) => {
    setSponsored(nextSponsored);
    startTransition(() => {
      setSponsoredAction(comparisonId, nextSponsored, label).catch(() => setSponsored(!nextSponsored));
    });
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 text-xs text-text-secondary">
      <label className="flex items-center gap-1.5">
        <input type="checkbox" checked={sponsored} onChange={(e) => save(e.target.checked)} className="h-3.5 w-3.5" />
        Sponsored
      </label>
      {sponsored && (
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => save(true)}
          placeholder="Sponsor name"
          maxLength={60}
          className="flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none"
        />
      )}
    </div>
  );
}
