"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { updateDataConsentAction, type DataConsentTier } from "@/lib/actions/dataConsent";

const TIERS: { value: DataConsentTier; label: string; description: string }[] = [
  {
    value: "none",
    label: "None",
    description: "Don't use my activity for personalization or any aggregate, cross-user features.",
  },
  {
    value: "anonymous",
    label: "Anonymous only",
    description: "Count my votes in fully anonymous aggregate stats (like Global Pulse), never tied to my identity.",
  },
  {
    value: "aggregated",
    label: "Aggregated",
    description: "Include me in aggregate breakdowns other people can see, like country-level results.",
  },
  {
    value: "personalized",
    label: "Personalized (recommended)",
    description: "Use my activity to personalize my own feed and recommendations.",
  },
  {
    value: "advertising",
    label: "Personalized + advertising",
    description: "Also allow using my preference data for ad targeting.",
  },
  {
    value: "research",
    label: "Personalized + research",
    description: "Also allow anonymized use of my data for product research.",
  },
  {
    value: "licensing",
    label: "Personalized + data licensing",
    description: "Also allow anonymized, aggregated data about me in data-licensing products.",
  },
];

export function DataConsentSettings({ initialTier }: { initialTier: DataConsentTier }) {
  const [tier, setTier] = useState(initialTier);
  const [isPending, startTransition] = useTransition();

  const select = (next: DataConsentTier) => {
    if (next === tier) return;
    const prev = tier;
    setTier(next);
    startTransition(async () => {
      try {
        await updateDataConsentAction(next);
      } catch {
        setTier(prev);
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text-secondary">Data & privacy</p>
      <p className="text-xs text-text-secondary">
        Choose how your activity can be used. Below &ldquo;Personalized,&rdquo; your own feed still works - you just
        get the trending feed instead of a tailored one.
      </p>
      <div className="space-y-2">
        {TIERS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => select(t.value)}
            disabled={isPending}
            className={clsx(
              "tap-scale w-full rounded-lg border p-3 text-left transition-colors",
              tier === t.value ? "border-accent bg-accent-soft" : "border-border bg-surface-raised"
            )}
          >
            <p className="text-sm font-semibold text-text-primary">{t.label}</p>
            <p className="text-xs text-text-secondary">{t.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
