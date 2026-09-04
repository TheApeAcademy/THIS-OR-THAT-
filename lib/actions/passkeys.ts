"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PasskeyRow {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export async function getPasskeysAction(): Promise<PasskeyRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("passkey_credentials")
    .select("id, device_label, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    deviceLabel: r.device_label,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

export async function removePasskeyAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("passkey_credentials").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
}
