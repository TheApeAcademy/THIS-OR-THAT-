"use server";

import { createClient } from "@/lib/supabase/server";

// Fire-and-forget view counter, mirroring how logCardViewAction is only ever
// called from a client useEffect (never a server-rendered route) so link
// previews/crawlers don't inflate it. Per-browser de-dupe (so the same
// scroll session doesn't recount) lives client-side in the caller.
export async function incrementComparisonViewAction(comparisonId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_comparison_view", { p_comparison_id: comparisonId });
}
