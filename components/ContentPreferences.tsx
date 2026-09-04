"use client";

import { useState, useTransition } from "react";
import { updateCategoryWeightAction } from "@/lib/actions/settings";

export interface CategoryOption {
  id: string;
  label: string;
  emoji: string | null;
}

const DIALS: { value: -1 | 0 | 1; label: string }[] = [
  { value: -1, label: "Less" },
  { value: 0, label: "Normal" },
  { value: 1, label: "More" },
];

export function ContentPreferences({
  categories,
  initialWeights,
}: {
  categories: CategoryOption[];
  initialWeights: Record<string, -1 | 0 | 1>;
}) {
  const [weights, setWeights] = useState(initialWeights);
  const [, startTransition] = useTransition();

  const setWeight = (categoryId: string, weight: -1 | 0 | 1) => {
    const previous = weights[categoryId] ?? 0;
    setWeights((prev) => ({ ...prev, [categoryId]: weight }));
    startTransition(() => {
      updateCategoryWeightAction(categoryId, weight).catch(() => {
        setWeights((prev) => ({ ...prev, [categoryId]: previous }));
      });
    });
  };

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-4">
      <p className="mb-1 text-sm font-semibold text-text-secondary">Content preferences</p>
      <p className="mb-3 text-xs text-text-secondary">
        Tell your feed what to show you more or less of.
      </p>
      <div className="space-y-3">
        {categories.map((cat) => {
          const weight = weights[cat.id] ?? 0;
          return (
            <div key={cat.id} className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm text-text-primary">
                {cat.emoji ? `${cat.emoji} ` : ""}
                {cat.label}
              </p>
              <div className="glass flex shrink-0 gap-1 rounded-full p-1">
                {DIALS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setWeight(cat.id, d.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      weight === d.value ? "bg-accent text-accent-contrast" : "text-text-secondary"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
