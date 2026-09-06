"use server";

import { createClient } from "@/lib/supabase/server";

// Best-effort attribution log for the public /d/[id] share links - never
// blocks or errors the page render if it fails.
export async function logLinkVisitAction(comparisonId: string, source: string | null) {
  const supabase = await createClient();
  await supabase.from("link_visits").insert({ comparison_id: comparisonId, source }).then(
    () => {},
    () => {}
  );
}
