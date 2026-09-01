"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CardAccessPatch {
  show_dna?: boolean | null;
  show_play_score?: boolean | null;
  show_streak?: boolean | null;
  show_avatar_3d?: boolean | null;
  show_zodiac?: boolean | null;
  show_bio?: boolean | null;
  blocked?: boolean;
}

export async function upsertCardAccessRuleAction(viewerId: string, patch: CardAccessPatch) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (viewerId === user.id) throw new Error("Cannot set an access rule for yourself");

  const { error } = await supabase
    .from("card_access_rules")
    .upsert(
      { owner_id: user.id, viewer_id: viewerId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "owner_id,viewer_id" }
    );
  if (error) throw error;
  revalidatePath("/profile/connections");
}

export async function blockViewerAction(viewerId: string) {
  return upsertCardAccessRuleAction(viewerId, { blocked: true });
}

export async function unblockViewerAction(viewerId: string) {
  return upsertCardAccessRuleAction(viewerId, { blocked: false });
}

export async function deleteCardAccessRuleAction(viewerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("card_access_rules")
    .delete()
    .eq("owner_id", user.id)
    .eq("viewer_id", viewerId);
  if (error) throw error;
  revalidatePath("/profile/connections");
}
