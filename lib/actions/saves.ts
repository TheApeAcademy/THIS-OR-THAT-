"use server";

import { revalidatePath } from "next/cache";
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

const MAX_COLLECTION_NAME = 60;

export async function createCollectionAction(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = name.trim().slice(0, MAX_COLLECTION_NAME);
  if (!trimmed) throw new Error("Name your collection.");

  const { data, error } = await supabase
    .from("bookmark_collections")
    .insert({ user_id: user.id, name: trimmed })
    .select("id, name, created_at")
    .single();
  if (error) throw error;

  revalidatePath("/saved");
  return data;
}

export async function deleteCollectionAction(collectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("bookmark_collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/saved");
}

export async function moveBookmarkAction(comparisonId: string, collectionId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("saved_comparisons")
    .update({ collection_id: collectionId })
    .eq("comparison_id", comparisonId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/saved");
}
