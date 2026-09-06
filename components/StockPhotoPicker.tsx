"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { saveStockImageAction } from "@/lib/actions/stockImages";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

interface Candidate {
  url: string;
  thumbUrl: string;
  attribution: string;
}

export function StockPhotoPicker({
  open,
  onClose,
  defaultQuery,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  defaultQuery: string;
  onPick: (url: string) => void;
}) {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<Candidate[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [pickingUrl, setPickingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const trimmed = query.trim();
    if (!trimmed || searching) return;
    setSearching(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: invokeError } = await supabase.functions.invoke<{ results: Candidate[]; error?: string }>(
        "search-stock-images",
        { body: { query: trimmed } }
      );
      if (invokeError || data?.error) {
        setError("Couldn't search for photos right now.");
      } else {
        setResults(data?.results ?? []);
      }
    } catch {
      setError("Couldn't search for photos right now.");
    } finally {
      setSearching(false);
    }
  };

  const pick = async (candidate: Candidate) => {
    if (pickingUrl) return;
    setPickingUrl(candidate.url);
    try {
      const finalUrl = await saveStockImageAction(candidate.url);
      onPick(finalUrl);
      onClose();
    } catch {
      setError("Couldn't use that photo - try another.");
    } finally {
      setPickingUrl(null);
    }
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm font-bold text-text-primary">Find a photo</p>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") search();
            }}
            placeholder="e.g. BMW"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
          />
          <Button size="sm" onClick={search} disabled={!query.trim() || searching}>
            {searching ? "Searching…" : "Search"}
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {results && results.length === 0 && !searching && (
          <p className="text-sm text-text-secondary">No photos found - try a different word.</p>
        )}
        {results && results.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {results.map((c) => (
              <button
                key={c.thumbUrl}
                type="button"
                onClick={() => pick(c)}
                disabled={!!pickingUrl}
                className="tap-scale relative aspect-square overflow-hidden rounded-xl disabled:opacity-40"
              >
                <Image src={c.thumbUrl} alt={c.attribution} fill className="object-cover" unoptimized />
                {pickingUrl === c.url && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                    Using…
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
