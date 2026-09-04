import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** Users this viewer has blocked or muted — either way, their content should stay out of the viewer's feeds. */
export async function getHiddenAuthorIds(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string[]> {
  const [{ data: blocked }, { data: muted }] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", userId),
    supabase.from("mutes").select("muted_id").eq("muter_id", userId),
  ]);

  return [
    ...new Set([
      ...(blocked ?? []).map((b) => b.blocked_id),
      ...(muted ?? []).map((m) => m.muted_id),
    ]),
  ];
}
