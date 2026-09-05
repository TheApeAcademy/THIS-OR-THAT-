"use server";

import { createClient } from "@/lib/supabase/server";

// Fire-and-forget, mirrors incrementComparisonViewAction - only ever called
// from a client useEffect on the comparison detail page, never during SSR,
// so a crawler/link-preview fetch doesn't pollute the viewer's history.
export async function recordRecentlyViewedAction(comparisonId: string) {
  const supabase = await createClient();
  await supabase.rpc("record_recently_viewed", { p_comparison_id: comparisonId });
}
