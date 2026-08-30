"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleSaveComparisonAction(comparisonId: string, save: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (save) {
    const { error } = await supabase
      .from("saved_comparisons")
      .insert({ comparison_id: comparisonId, user_id: user.id });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("saved_comparisons")
      .delete()
      .eq("comparison_id", comparisonId)
      .eq("user_id", user.id);
    if (error) throw error;
  }
}
