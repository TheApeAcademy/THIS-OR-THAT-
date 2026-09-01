"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createDuelChallengeAction } from "@/lib/actions/duels";
import { searchUsersAction, type UserSearchResult } from "@/lib/actions/users";

interface Category {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
}

export function CreateDuelForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [label, setLabel] = useState("");
  const [statement, setStatement] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [target, setTarget] = useState<UserSearchResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestQueryRef = useRef("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      latestQueryRef.current = trimmed;
      searchUsersAction(trimmed).then((found) => {
        if (latestQueryRef.current === trimmed) setResults(found);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const effectiveResults = useMemo(() => (query.trim().length >= 2 ? results : []), [query, results]);
  const canSubmit = label.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const id = await createDuelChallengeAction({
        prompt: prompt.trim() || null,
        categoryId: categoryId || null,
        label: label.trim(),
        statement: statement.trim() || null,
        targetUserId: target?.id ?? null,
      });
      router.push(`/duels?created=${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        State your stance. Challenge a specific person, or leave it open for whoever wants to argue the other side.
      </p>

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

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What's the debate? (optional)"
        maxLength={200}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />

      <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-sm font-semibold text-text-secondary">Your side</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Your stance, e.g. 'Kendrick'"
          maxLength={60}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
        />
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Make your case (optional)"
          maxLength={220}
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-text-secondary">Challenge someone (optional)</p>
        {target ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3">
            <Avatar name={target.username} src={target.avatarUrl} size={32} />
            <p className="flex-1 text-sm font-semibold text-text-primary">@{target.username}</p>
            <button type="button" onClick={() => setTarget(null)} className="tap-scale text-xs font-medium text-danger">
              Remove
            </button>
          </div>
        ) : (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username, or leave blank for an open duel"
              className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
            />
            {effectiveResults.length > 0 && (
              <div className="space-y-1">
                {effectiveResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setTarget(r);
                      setQuery("");
                      setResults([]);
                    }}
                    className="tap-scale flex w-full items-center gap-3 rounded-lg border border-border bg-surface-raised p-3 text-left"
                  >
                    <Avatar name={r.username} src={r.avatarUrl} size={32} />
                    <p className="text-sm font-semibold text-text-primary">@{r.username}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
        {isSubmitting ? "Starting…" : target ? `Challenge @${target.username}` : "Post open duel"}
      </Button>
    </div>
  );
}
