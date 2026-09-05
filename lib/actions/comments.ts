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

const MAX_COMMENT_LENGTH = 2000;

export async function editCommentAction(commentId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim().slice(0, MAX_COMMENT_LENGTH);
  if (!trimmed) throw new Error("Comment can't be empty.");

  const { data: comment, error } = await supabase
    .from("comments")
    .update({ body: trimmed, edited_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("comparison_id")
    .single();
  if (error) throw error;

  revalidatePath(`/comparison/${comment.comparison_id}`);
}

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: comment, error } = await supabase
    .from("comments")
    .update({ status: "removed" })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select("comparison_id")
    .single();
  if (error) throw error;

  revalidatePath(`/comparison/${comment.comparison_id}`);
}

export type CommentReactionType = "helpful" | "funny" | "convincing";

export async function toggleCommentReactionAction(
  commentId: string,
  type: CommentReactionType,
  add: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (add) {
    const { error } = await supabase
      .from("comment_reactions")
      .insert({ comment_id: commentId, user_id: user.id, type });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .eq("type", type);
    if (error) throw error;
  }
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
