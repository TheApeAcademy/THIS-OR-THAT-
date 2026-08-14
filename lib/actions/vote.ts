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

  if (error && error.code !== "23505") throw error;

  revalidatePath("/home");
}
