"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  adminSearchUsersAction,
  setVerificationAction,
  type AdminUserSearchResult,
  type VerificationType,
} from "@/lib/actions/admin";

export function AdminVerifyUser() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserSearchResult[]>([]);
  const [, startTransition] = useTransition();

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  useEffect(() => {
    if (!searching) return;
    const timer = setTimeout(() => {
      adminSearchUsersAction(trimmed).then(setResults);
    }, 250);
    return () => clearTimeout(timer);
  }, [trimmed, searching]);

  const visibleResults = searching ? results : [];

  const setType = (userId: string, type: VerificationType) => {
    setResults((prev) => prev.map((r) => (r.id === userId ? { ...r, verificationType: type } : r)));
    startTransition(() => {
      setVerificationAction(userId, type).catch(() => {});
    });
  };

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search username…"
        className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
      />
      <div className="space-y-2">
        {visibleResults.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
            <span className="text-sm font-medium text-text-primary">@{r.username}</span>
            <div className="flex gap-1.5">
              {(["none", "identity", "social"] as VerificationType[]).map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={r.verificationType === type ? "primary" : "secondary"}
                  onClick={() => setType(r.id, type)}
                >
                  {type === "none" ? "None" : type === "identity" ? "Identity" : "Social"}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
