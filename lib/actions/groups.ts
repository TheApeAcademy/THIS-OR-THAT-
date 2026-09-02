"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_POST_LENGTH = 500;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "group"
  );
}

export async function createGroupAction(name: string, description: string | null): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Give your group a name.");
  if (trimmedName.length > MAX_NAME_LENGTH) throw new Error(`Keep it under ${MAX_NAME_LENGTH} characters.`);
  const trimmedDescription = description?.trim().slice(0, MAX_DESCRIPTION_LENGTH) || null;

  const base = slugify(trimmedName);
  let slug = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase.from("groups").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({ slug, name: trimmedName, description: trimmedDescription, created_by: user.id })
    .select("slug")
    .single();
  if (error) throw error;

  revalidatePath("/groups");
  return data.slug as string;
}

export async function joinGroupAction(groupId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
  if (error && error.code !== "23505") throw error;
  revalidatePath("/groups");
}

export async function leaveGroupAction(groupId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/groups");
}

export async function createGroupPostAction(groupId: string, body: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Say something first.");
  if (trimmed.length > MAX_POST_LENGTH) throw new Error(`Keep it under ${MAX_POST_LENGTH} characters.`);

  const { error } = await supabase.from("group_posts").insert({ group_id: groupId, user_id: user.id, body: trimmed });
  if (error) {
    if (error.code === "42501" || error.message?.includes("row-level security")) {
      throw new Error("Join the group to post on its wall.");
    }
    throw error;
  }
  revalidatePath("/groups");
}

export async function createGroupPostCommentAction(postId: string, body: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Say something first.");
  if (trimmed.length > MAX_POST_LENGTH) throw new Error(`Keep it under ${MAX_POST_LENGTH} characters.`);

  const { error } = await supabase.from("group_post_comments").insert({ post_id: postId, user_id: user.id, body: trimmed });
  if (error) throw error;
  revalidatePath("/groups");
}

export async function toggleGroupPostLikeAction(postId: string, like: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (like) {
    const { error } = await supabase.from("group_post_likes").insert({ post_id: postId, user_id: user.id });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase.from("group_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    if (error) throw error;
  }
}

export interface CreateGroupDebateInput {
  groupId: string;
  opponentLabel: string;
  opponentGroupId: string | null;
  prompt: string | null;
  categoryId: string | null;
  expiresInHours: number | null;
}

/** Starts a comparison with this group as one side - the simplest faithful
 * fit for "Wizkid FC vs 30BG": a normal 2-option comparison where one (or
 * both) options are tagged to a group via comparison_options.group_id, so
 * the result rolls up into the group's win/loss record once it resolves. */
export async function createGroupDebateAction(input: CreateGroupDebateInput): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: group, error: groupError } = await supabase.from("groups").select("name").eq("id", input.groupId).single();
  if (groupError) throw groupError;

  const opponentLabel = input.opponentLabel.trim();
  if (!opponentLabel) throw new Error("Name the other side of this debate.");
  if (opponentLabel.length > 60) throw new Error("Keep it under 60 characters.");

  let expiresAt: string | null = null;
  if (input.expiresInHours) {
    expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000).toISOString();
  }

  const { data: comparison, error: comparisonError } = await supabase
    .from("comparisons")
    .insert({
      creator_id: user.id,
      category_id: input.categoryId,
      prompt: input.prompt?.trim() || null,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (comparisonError) throw comparisonError;

  const { error: optionsError } = await supabase.from("comparison_options").insert([
    { comparison_id: comparison.id, side: "a", label: group.name, group_id: input.groupId },
    { comparison_id: comparison.id, side: "b", label: opponentLabel, group_id: input.opponentGroupId },
  ]);
  if (optionsError) throw optionsError;

  revalidatePath("/groups");
  return comparison.id as string;
}
