"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function voteAction(comparisonId: string, optionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("votes").insert({
    user_id: user.id,
    comparison_id: comparisonId,
    option_id: optionId,
  });

  if (error && error.code === "23505") {
    // Already voted on this comparison — this is an opinion change, not a
    // duplicate. change_vote() handles the counter adjustments and logs it.
    const { error: changeError } = await supabase.rpc("change_vote", {
      p_comparison_id: comparisonId,
      p_option_id: optionId,
    });
    if (changeError) throw changeError;
  } else if (error) {
    throw error;
  } else {
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

export async function setVoteChangeReasonAction(comparisonId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("set_last_vote_change_reason", {
    p_comparison_id: comparisonId,
    p_reason: reason,
  });
  if (error) throw error;
}
