"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ComparisonVisibility } from "@/lib/actions/createComparison";
import type { Json } from "@/lib/database.types";

export interface DraftOption {
  label: string;
  imageUrl: string | null;
}

export interface DraftInput {
  id?: string;
  categoryId: string | null;
  prompt: string | null;
  visibility: ComparisonVisibility;
  options: DraftOption[];
}

export async function saveDraftAction(input: DraftInput): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = {
    creator_id: user.id,
    category_id: input.categoryId,
    prompt: input.prompt,
    visibility: input.visibility,
    options: input.options as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("comparison_drafts").update(row).eq("id", input.id).eq("creator_id", user.id);
    if (error) throw error;
    revalidatePath("/create");
    return input.id;
  }

  const { data, error } = await supabase.from("comparison_drafts").insert(row).select("id").single();
  if (error) throw error;
  revalidatePath("/create");
  return data.id as string;
}

export async function deleteDraftAction(draftId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("comparison_drafts")
    .delete()
    .eq("id", draftId)
    .eq("creator_id", user.id);
  if (error) throw error;

  revalidatePath("/create");
}
