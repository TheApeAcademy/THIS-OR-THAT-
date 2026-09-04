"use server";

import { createClient } from "@/lib/supabase/server";

export async function dismissFeedItemAction(comparisonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("feed_dismissals")
    .insert({ user_id: user.id, comparison_id: comparisonId });
  if (error && error.code !== "23505") throw error;
}
