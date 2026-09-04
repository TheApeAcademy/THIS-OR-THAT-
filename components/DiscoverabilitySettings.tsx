"use client";

import { useState, useTransition } from "react";
import { Toggle } from "@/components/ui/Toggle";
import {
  updateDiscoverabilityAction,
  type DiscoverabilitySettings as DiscoverabilityValues,
} from "@/lib/actions/security";

const ROWS: { key: keyof DiscoverabilityValues; label: string; description: string }[] = [
  {
    key: "discoverableByEmail",
    label: "Find me by email",
    description: "Let people who know your email find your account in search.",
  },
  {
    key: "discoverableByPhone",
    label: "Find me by phone",
    description: "Let people who know your phone number find your account.",
  },
  {
    key: "suggestToOthers",
    label: "Suggest my account to others",
    description: "Allow This or That to recommend your profile to other users.",
  },
  {
    key: "hideSensitiveContent",
    label: "Hide sensitive content",
    description: "Blur debates the creator marked sensitive until you tap to reveal.",
  },
];

export function DiscoverabilitySettings({ initial }: { initial: DiscoverabilityValues }) {
  const [values, setValues] = useState(initial);
  const [, startTransition] = useTransition();

  const toggle = (key: keyof DiscoverabilityValues, next: boolean) => {
    setValues((prev) => ({ ...prev, [key]: next }));
    startTransition(() => {
      updateDiscoverabilityAction({ [key]: next }).catch(() => {
        setValues((prev) => ({ ...prev, [key]: !next }));
      });
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Discoverability &amp; content</p>
      <div className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{row.label}</p>
              <p className="text-xs text-text-secondary">{row.description}</p>
            </div>
            <Toggle
              checked={values[row.key]}
              onChange={(next) => toggle(row.key, next)}
              label={row.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
