"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CARD_THEMES, type CardTheme } from "@/lib/cardThemes";

async function snapshotCardVersion(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: card } = await supabase
    .from("cards")
    .select("id, snapshot, theme")
    .eq("user_id", userId)
    .maybeSingle();
  if (!card) return;

  await supabase.from("card_versions").insert({
    card_id: card.id,
    snapshot: card.snapshot ?? {},
    theme: card.theme,
  });
}

// Called from other card-editing actions (e.g. updateProfileCardAction) so
// a bio/social-link edit gets logged to card_versions too, not just a theme
// change - best-effort, never blocks the caller's own save.
export async function recordCardVersionAction(userId: string) {
  const supabase = await createClient();
  await snapshotCardVersion(supabase, userId);
}

export async function updateCardThemeAction(theme: CardTheme) {
  if (!(theme in CARD_THEMES)) throw new Error("Unknown theme.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("cards").update({ theme }).eq("user_id", user.id);
  if (error) throw error;

  await snapshotCardVersion(supabase, user.id);

  revalidatePath("/profile");
  revalidatePath("/card");
}

export interface CardVersionRow {
  id: string;
  theme: string;
  createdAt: string;
}

export async function getCardVersionsAction(): Promise<CardVersionRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: card } = await supabase.from("cards").select("id").eq("user_id", user.id).maybeSingle();
  if (!card) return [];

  const { data } = await supabase
    .from("card_versions")
    .select("id, theme, created_at")
    .eq("card_id", card.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((v) => ({ id: v.id, theme: v.theme, createdAt: v.created_at }));
}
