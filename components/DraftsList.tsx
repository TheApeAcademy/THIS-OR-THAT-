"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteDraftAction } from "@/lib/actions/drafts";

export interface DraftSummary {
  id: string;
  prompt: string | null;
  optionLabels: string[];
  updatedAt: string;
}

export function DraftsList({ drafts }: { drafts: DraftSummary[] }) {
  const [items, setItems] = useState(drafts);

  const remove = (id: string) => {
    setItems((prev) => prev.filter((d) => d.id !== id));
    deleteDraftAction(id).catch(() => {
      setItems(drafts);
    });
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Drafts</p>
      {items.map((d) => (
        <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
          <Link href={`/create?draft=${d.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">
              {d.prompt || d.optionLabels.filter(Boolean).join(" vs ") || "Untitled draft"}
            </p>
          </Link>
          <button onClick={() => remove(d.id)} className="tap-scale shrink-0 text-xs font-medium text-danger">
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
