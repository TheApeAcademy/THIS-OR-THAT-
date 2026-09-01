"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function voteAction(comparisonId: string, optionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("expires_at")
    .eq("id", comparisonId)
    .maybeSingle();
  if (comparison?.expires_at && new Date(comparison.expires_at).getTime() <= Date.now()) {
    throw new Error("This poll has closed.");
  }

  const { error } = await supabase.from("votes").insert({
    user_id: user.id,
    comparison_id: comparisonId,
    option_id: optionId,
  });

  if (error && error.code !== "23505") throw error;

  if (!error) {
    // Best-effort daily streak bump — never let this fail the vote itself.
    // Awaited (not fire-and-forget) since serverless functions can be frozen
    // right after the action returns, killing an un-awaited in-flight call.
    try {
      await supabase.rpc("bump_streak", { p_user_id: user.id });
    } catch {
      // ignore
    }
  }

  revalidatePath("/home");
}
