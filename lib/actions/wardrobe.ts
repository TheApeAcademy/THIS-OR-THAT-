"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WardrobeSlot = "headwear" | "top" | "bottom" | "shoes" | "accessory";

export async function claimFreeItemAction(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_wardrobe")
    .insert({ user_id: user.id, item_id: itemId, source: "free" });
  if (error) throw new Error("Couldn't claim that item — it may not be free.");

  revalidatePath("/profile");
}

export async function purchaseItemAction(itemId: string) {
  void itemId; // kept for the real purchase flow once payments are wired
  throw new Error("Wardrobe purchases aren't live yet — payments are launching soon.");
}

export async function equipItemAction(slot: WardrobeSlot, itemId: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_outfit")
    .upsert({ user_id: user.id, slot, item_id: itemId, updated_at: new Date().toISOString() });
  if (error) throw new Error("Couldn't equip that item.");

  revalidatePath("/profile");
}
