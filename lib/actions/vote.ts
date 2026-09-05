"use server";

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

  const { data: existingVote } = await supabase
    .from("votes")
    .select("option_id")
    .eq("user_id", user.id)
    .eq("comparison_id", comparisonId)
    .maybeSingle();

  let wrote = false;
  if (!existingVote) {
    const { error } = await supabase.from("votes").insert({
      user_id: user.id,
      comparison_id: comparisonId,
      option_id: optionId,
    });
    if (error) throw error;
    wrote = true;
  } else if (existingVote.option_id !== optionId) {
    // Voting is a preference, not a one-shot commitment - switch it rather
    // than reject it. change_vote() moves the tile counts itself (no
    // trigger on votes UPDATE anymore - see 0089_vote_switch_reconciliation.sql)
    // and also updates preference_signals + logs a vote_changes row.
    const { error } = await supabase.rpc("change_vote", {
      p_comparison_id: comparisonId,
      p_option_id: optionId,
    });
    if (error) throw error;
    wrote = true;
  }

  if (wrote) {
    // Best-effort daily streak bump - never let this fail the vote itself.
    // Awaited (not fire-and-forget) since serverless functions can be frozen
    // right after the action returns, killing an un-awaited in-flight call.
    try {
      await supabase.rpc("bump_streak", { p_user_id: user.id });
    } catch {
      // ignore
    }
  }

  // Deliberately no revalidatePath("/home") here: the vote is already
  // applied optimistically client-side (FullScreenFeed.applyVote), and
  // get_feed_order() is randomized per call, so forcing a refetch after
  // every vote would reshuffle the whole feed out from under the user
  // mid-scroll instead of just reflecting this one card's new count.
}
