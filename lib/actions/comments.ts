"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function postCommentAction(
  comparisonId: string,
  optionId: string,
  body: string,
  parentCommentId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("comments").insert({
    comparison_id: comparisonId,
    option_id: optionId,
    user_id: user.id,
    body,
    parent_comment_id: parentCommentId ?? null,
  });
  if (error) throw error;

  revalidatePath(`/comparison/${comparisonId}`);
}

export async function toggleCommentLikeAction(commentId: string, like: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (like) {
    const { error } = await supabase
      .from("comment_likes")
      .insert({ comment_id: commentId, user_id: user.id });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    if (error) throw error;
  }
}
