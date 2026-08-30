"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleCardLikeAction(cardId: string, like: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (like) {
    const { error } = await supabase.from("card_likes").insert({ card_id: cardId, user_id: user.id });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("card_likes")
      .delete()
      .eq("card_id", cardId)
      .eq("user_id", user.id);
    if (error) throw error;
  }
}
