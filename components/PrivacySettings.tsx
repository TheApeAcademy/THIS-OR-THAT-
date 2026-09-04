"use client";

import { useState, useTransition } from "react";
import {
  updatePrivacyAction,
  updateCountryAction,
  type PrivacySettings as PrivacySettingsValues,
  type Visibility,
} from "@/lib/actions/settings";

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "public", label: "Public — anyone" },
  { value: "followers", label: "Followers only" },
  { value: "private", label: "Only me" },
];

const ROWS: { key: keyof PrivacySettingsValues; label: string; description: string }[] = [
  { key: "cardVisibility", label: "My Card", description: "Who can open your public This or That Card." },
  {
    key: "preferenceVisibility",
    label: "Preference DNA",
    description: "Who can see your category breakdown and inferred preferences.",
  },
  { key: "socialLinksVisibility", label: "Social links", description: "Who can see the links on your card." },
  {
    key: "compatibilityVisibility",
    label: "Compatibility",
    description: "Who can compare their preferences against yours.",
  },
];

const COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "Ghana",
  "Kenya",
  "South Africa",
  "India",
  "Germany",
  "France",
  "Spain",
  "Brazil",
  "Mexico",
  "Australia",
  "United Arab Emirates",
];

export function PrivacySettings({
  initial,
  initialCountry,
}: {
  initial: PrivacySettingsValues;
  initialCountry: string | null;
}) {
  const [values, setValues] = useState(initial);
  const [country, setCountry] = useState(initialCountry ?? "");
  const [, startTransition] = useTransition();

  const update = (key: keyof PrivacySettingsValues, value: Visibility) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    startTransition(() => {
      updatePrivacyAction({ [key]: value }).catch(() => {
        setValues((prev) => ({ ...prev, [key]: initial[key] }));
      });
    });
  };

  const updateCountry = (value: string) => {
    setCountry(value);
    startTransition(() => {
      updateCountryAction(value || null).catch(() => setCountry(initialCountry ?? ""));
    });
  };

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="mb-3 text-sm font-semibold text-text-secondary">Privacy</p>
      <div className="space-y-4">
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{row.label}</p>
              <p className="text-xs text-text-secondary">{row.description}</p>
            </div>
            <select
              value={values[row.key]}
              onChange={(e) => update(row.key, e.target.value as Visibility)}
              className="shrink-0 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">Country</p>
            <p className="text-xs text-text-secondary">Powers country leaderboards and Global Pulse.</p>
          </div>
          <select
            value={country}
            onChange={(e) => updateCountry(e.target.value)}
            className="shrink-0 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
          >
            <option value="">Not set</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
