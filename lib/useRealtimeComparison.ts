"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Live vote counts (by option id) and comment count for one open comparison. */
export function useRealtimeComparison(comparisonId: string) {
  const [optionCounts, setOptionCounts] = useState<Record<string, number>>({});
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [trackedId, setTrackedId] = useState(comparisonId);

  // Reset during render (not in an effect) when the comparison changes, so
  // stale counts from a previous comparison never flash before fresh data
  // arrives — React's documented pattern for "adjusting state when a prop
  // changes" without an extra render pass.
  if (comparisonId !== trackedId) {
    setTrackedId(comparisonId);
    setOptionCounts({});
    setCommentCount(null);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comparison-${comparisonId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comparison_options",
          filter: `comparison_id=eq.${comparisonId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; vote_count: number };
          setOptionCounts((prev) => ({ ...prev, [row.id]: row.vote_count }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comparisons", filter: `id=eq.${comparisonId}` },
        (payload) => {
          const row = payload.new as { comment_count: number };
          setCommentCount(row.comment_count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [comparisonId]);

  return { optionCounts, commentCount };
}
