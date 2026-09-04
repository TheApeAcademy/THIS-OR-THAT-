"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCardThemeKey } from "@/lib/cardThemes";

export async function updateCardThemeAction(theme: string) {
  if (!isCardThemeKey(theme)) throw new Error("Unknown theme.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("cards").update({ theme }).eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/card");
  revalidatePath("/profile");
}

export interface CardVersionRow {
  id: string;
  createdAt: string;
}

export async function getCardHistoryAction(): Promise<CardVersionRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: card } = await supabase.from("cards").select("id").eq("user_id", user.id).maybeSingle();
  if (!card) return [];

  const { data } = await supabase
    .from("card_versions")
    .select("id, created_at")
    .eq("card_id", card.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((r) => ({ id: r.id, createdAt: r.created_at }));
}
