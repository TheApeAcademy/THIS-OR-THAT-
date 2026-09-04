"use server";

import { createClient } from "@/lib/supabase/server";
import { getHiddenAuthorIds } from "@/lib/blocks";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import type { ComparisonCardData } from "@/components/ComparisonCard";

export async function recordRecentlyViewedAction(comparisonId: string) {
  const supabase = await createClient();
  // Best-effort — a logged-out viewer or a transient failure shouldn't
  // block the page itself, so errors are swallowed here rather than at
  // every call site. Supabase's query builder is PromiseLike (only
  // `.then`), not a real Promise, so rejection handling uses the two-arg
  // `.then(onFulfilled, onRejected)` form rather than `.catch`.
  await supabase.rpc("record_recently_viewed", { p_comparison_id: comparisonId }).then(
    () => {},
    () => {}
  );
}

interface RecentRow {
  comparison_id: string;
  viewed_at: string;
  comparisons: (RawComparisonWithOptions & { creator_id: string | null; status: string }) | null;
}

export async function getRecentlyViewedAction(): Promise<ComparisonCardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: rows }, hiddenAuthorIds] = await Promise.all([
    supabase
      .from("recently_viewed")
      .select(
        "comparison_id, viewed_at, comparisons(id, prompt, creator_id, status, comparison_options(id, side, label, image_url, vote_count))"
      )
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(30)
      .returns<RecentRow[]>(),
    getHiddenAuthorIds(supabase, user.id),
  ]);

  const hiddenSet = new Set(hiddenAuthorIds);
  const comparisons = (rows ?? [])
    .map((r) => r.comparisons)
    .filter((c): c is NonNullable<RecentRow["comparisons"]> =>
      !!c && c.status === "active" && (!c.creator_id || !hiddenSet.has(c.creator_id))
    );

  const ids = comparisons.map((c) => c.id);
  const { data: myVotes } = ids.length
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ids)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  return comparisons
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c): c is ComparisonCardData => c !== null);
}
