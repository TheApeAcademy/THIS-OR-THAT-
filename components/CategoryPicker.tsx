"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { buzz, HAPTIC } from "@/lib/haptics";

export interface CategoryOption {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
}

const MIN_SELECTED = 3;

export function CategoryPicker({
  categories,
  onContinue,
  isPending,
  error,
}: {
  categories: CategoryOption[];
  onContinue: (categoryIds: string[]) => void;
  isPending: boolean;
  error?: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    buzz(HAPTIC.tap);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    buzz(HAPTIC.confirm);
    setSelected(new Set(categories.map((c) => c.id)));
  };

  return (
    <div
      className="flex h-[100dvh] flex-col gap-6 px-6 pb-10"
      style={{ paddingTop: "calc(var(--safe-top) + 40px)" }}
    >
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-text-primary">
          What are you into?
        </p>
        <p className="mt-2 text-text-secondary">
          Pick at least {MIN_SELECTED}. We&rsquo;ll build your Preference DNA from a couple of
          picks in each.
        </p>
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto">
        {categories.map((c) => {
          const active = selected.has(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={clsx(
                "tap-scale flex items-center gap-2 rounded-xl px-4 py-4 text-left transition-colors",
                active ? "accent-gradient text-white" : "glass text-text-primary"
              )}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-semibold">{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {error && <p className="text-center text-sm text-danger">{error}</p>}
        <button onClick={selectAll} className="tap-scale text-center text-sm font-semibold text-accent">
          Select all {categories.length}
        </button>
        <Button
          className="w-full"
          disabled={selected.size < MIN_SELECTED || isPending}
          onClick={() => onContinue([...selected])}
        >
          {isPending ? "Building your deck…" : `Continue with ${selected.size}`}
        </Button>
      </div>
    </div>
  );
}
