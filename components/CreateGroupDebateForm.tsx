"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createGroupDebateAction } from "@/lib/actions/groups";

interface Category {
  id: string;
  label: string;
  emoji: string | null;
}

const EXPIRY_OPTIONS = [
  { label: "No limit", hours: null },
  { label: "4 hours", hours: 4 },
  { label: "24 hours", hours: 24 },
] as const;

export function CreateGroupDebateForm({ groupId, categories }: { groupId: string; categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [opponentLabel, setOpponentLabel] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [expiryHours, setExpiryHours] = useState<number | null>(24);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        ⚔️ Start a group debate
      </Button>
    );
  }

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const id = await createGroupDebateAction({
        groupId,
        opponentLabel,
        opponentGroupId: null,
        prompt: prompt || null,
        categoryId: categoryId || null,
        expiresInHours: expiryHours,
      });
      router.push(`/comparison/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What's the debate? (optional)"
        maxLength={200}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />
      <input
        value={opponentLabel}
        onChange={(e) => setOpponentLabel(e.target.value)}
        placeholder="Who's the other side? e.g. 'Drake fans'"
        maxLength={60}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />
      {categories.length > 0 && (
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      )}
      <div className="flex flex-wrap gap-2">
        {EXPIRY_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setExpiryHours(opt.hours)}
            className={`tap-scale rounded-full border px-3 py-1.5 text-sm font-medium ${
              expiryHours === opt.hours ? "border-accent bg-accent/15 text-accent" : "border-border text-text-secondary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={submit} disabled={!opponentLabel.trim() || isSubmitting}>
          {isSubmitting ? "Starting…" : "Start debate"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
