"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { searchUsersAction, type UserSearchResult } from "@/lib/actions/users";

export function UserSearch({ myUsername }: { myUsername: string | null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchUsersAction(trimmed);
        setResults(found);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const effectiveResults = useMemo(
    () => (query.trim().length >= 2 ? results : []),
    [query, results]
  );

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username"
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />

      {isPending && <p className="text-sm text-text-secondary">Searching…</p>}

      {!isPending && query.trim().length >= 2 && effectiveResults.length === 0 && (
        <p className="text-sm text-text-secondary">No one found with that username.</p>
      )}

      <div className="space-y-2">
        {effectiveResults.map((r) => (
          <Link
            key={r.username}
            href={myUsername ? `/compare/${r.username}/${myUsername}` : "/login"}
            className="tap-scale flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3"
          >
            <Avatar name={r.username} src={r.avatarUrl} size={36} />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {r.displayName || r.username}
              </p>
              <p className="text-xs text-text-secondary">@{r.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
