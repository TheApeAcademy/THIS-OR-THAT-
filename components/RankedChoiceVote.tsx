"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { submitRankedVoteAction } from "@/lib/actions/rankedChoice";

export interface RankableOption {
  id: string;
  label: string;
  imageUrl: string | null;
}

export function RankedChoiceVote({
  comparisonId,
  options,
  onSubmitted,
}: {
  comparisonId: string;
  options: RankableOption[];
  onSubmitted: () => void;
}) {
  const [order, setOrder] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setOrder((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));
  };

  const submit = () => {
    if (order.length < 2) return;
    setError(null);
    startTransition(async () => {
      try {
        await submitRankedVoteAction(comparisonId, order);
        onSubmitted();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't submit your ranking.");
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text-primary">Tap options in the order you prefer them.</p>
      <div className="space-y-2">
        {options.map((o) => {
          const rank = order.indexOf(o.id);
          return (
            <button
              key={o.id}
              onClick={() => toggle(o.id)}
              className="tap-scale flex w-full items-center gap-3 rounded-xl border border-border bg-surface-raised p-3 text-left"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: rank >= 0 ? "var(--accent)" : "var(--surface)",
                  color: rank >= 0 ? "white" : "var(--text-secondary)",
                }}
              >
                {rank >= 0 ? rank + 1 : ""}
              </span>
              <span className="flex-1 text-sm font-medium text-text-primary">{o.label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => setOrder([])}
          disabled={order.length === 0 || isPending}
        >
          Reset
        </Button>
        <Button className="flex-1" onClick={submit} disabled={order.length < 2 || isPending}>
          {isPending ? "Submitting…" : "Submit ranking"}
        </Button>
      </div>
    </div>
  );
}
