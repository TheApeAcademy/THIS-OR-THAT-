"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { addMutedWordAction, removeMutedWordAction, type MutedWordRow } from "@/lib/actions/security";

export function MutedWordsSettings({ initialWords }: { initialWords: MutedWordRow[] }) {
  const [words, setWords] = useState(initialWords);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const add = () => {
    const phrase = input.trim();
    if (!phrase) return;
    setInput("");
    setError(null);
    startTransition(async () => {
      try {
        const row = await addMutedWordAction(phrase);
        setWords((prev) => [row, ...prev]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't add that word.");
      }
    });
  };

  const remove = (id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
    startTransition(() => {
      removeMutedWordAction(id).catch(() => {});
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Muted words</p>
      <p className="text-xs text-text-secondary">
        Comments and debates containing these words are hidden from your feed.
      </p>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="e.g. spoilers"
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
        <Button size="sm" onClick={add} disabled={!input.trim()}>
          Add
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {words.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {words.map((w) => (
            <button
              key={w.id}
              onClick={() => remove(w.id)}
              className="tap-scale rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary"
            >
              {w.phrase} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
