"use client";

import { useState, useTransition } from "react";
import { updateDataConsentAction, type DataConsent } from "@/lib/actions/settings";

const OPTIONS: { value: DataConsent; label: string; description: string }[] = [
  {
    value: "none",
    label: "Don't use my preference data",
    description: "Your votes never contribute to any aggregate stat, recommendation, or research.",
  },
  {
    value: "anonymous",
    label: "Use anonymously",
    description: "Counted in aggregate stats, never tied back to you individually.",
  },
  {
    value: "aggregated",
    label: "Use aggregated data",
    description: "Included in things like Global Pulse's country-level breakdowns.",
  },
  {
    value: "personalized",
    label: "Allow personalized recommendations",
    description: "Your own votes shape your own feed. This is the default.",
  },
  {
    value: "advertising",
    label: "Allow advertising personalization",
    description: "Also allow your preferences to inform which sponsored content you see.",
  },
  {
    value: "research",
    label: "Allow research",
    description: "Aggregate data about you may be used for product research.",
  },
  {
    value: "licensing",
    label: "Allow commercial data licensing",
    description: "Aggregate preference intelligence — never raw personal data — may be licensed.",
  },
];

export function DataConsentSettings({ initial }: { initial: DataConsent }) {
  const [value, setValue] = useState<DataConsent>(initial);
  const [, startTransition] = useTransition();

  const update = (next: DataConsent) => {
    const previous = value;
    setValue(next);
    startTransition(() => {
      updateDataConsentAction(next).catch(() => setValue(previous));
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Your data</p>
      <p className="text-xs text-text-secondary">
        The difference: raw personal data (&ldquo;Banks, 22, likes iPhone&rdquo;) is never shared.
        Aggregate preference intelligence (&ldquo;78% of users 18-24 preferred Apple&rdquo;) is what
        these tiers control.
      </p>
      <div className="space-y-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
          >
            <input
              type="radio"
              name="data-consent"
              checked={value === o.value}
              onChange={() => update(o.value)}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{o.label}</p>
              <p className="text-xs text-text-secondary">{o.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
