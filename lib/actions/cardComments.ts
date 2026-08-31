"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function postCardCommentAction(
  cardId: string,
  shareSlug: string,
  body: string,
  parentCommentId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("card_comments").insert({
    card_id: cardId,
    user_id: user.id,
    body,
    parent_comment_id: parentCommentId ?? null,
  });
  if (error) throw error;

  revalidatePath(`/card/${shareSlug}`);
}
