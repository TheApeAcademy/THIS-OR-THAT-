"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleComparisonLikeAction(comparisonId: string, like: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (like) {
    const { error } = await supabase
      .from("comparison_likes")
      .insert({ comparison_id: comparisonId, user_id: user.id });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("comparison_likes")
      .delete()
      .eq("comparison_id", comparisonId)
      .eq("user_id", user.id);
    if (error) throw error;
  }
}
