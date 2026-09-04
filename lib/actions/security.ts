"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deviceLabelFromUserAgent } from "@/lib/deviceLabel";

/** Best-effort login-history entry — never blocks the sign-in it's logging. */
export async function recordLoginAction(userId: string) {
  try {
    const supabase = await createClient();
    const hdrs = await headers();
    const userAgent = hdrs.get("user-agent");
    const forwardedFor = hdrs.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim();

    await supabase.from("user_sessions").insert({
      user_id: userId,
      device_label: deviceLabelFromUserAgent(userAgent),
      user_agent: userAgent,
      ip_hash: ip ? createHash("sha256").update(ip).digest("hex") : null,
    });
  } catch {
    // ignore — login history is a nice-to-have, not a login gate
  }
}

export interface LoginHistoryRow {
  id: string;
  deviceLabel: string | null;
  createdAt: string;
}

export async function getLoginHistoryAction(): Promise<LoginHistoryRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_sessions")
    .select("id, device_label, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((r) => ({ id: r.id, deviceLabel: r.device_label, createdAt: r.created_at }));
}

export interface DiscoverabilitySettings {
  discoverableByEmail: boolean;
  discoverableByPhone: boolean;
  suggestToOthers: boolean;
  hideSensitiveContent: boolean;
}

export async function updateDiscoverabilityAction(fields: Partial<DiscoverabilitySettings>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: {
    discoverable_by_email?: boolean;
    discoverable_by_phone?: boolean;
    suggest_to_others?: boolean;
    hide_sensitive_content?: boolean;
  } = {};
  if (fields.discoverableByEmail !== undefined) update.discoverable_by_email = fields.discoverableByEmail;
  if (fields.discoverableByPhone !== undefined) update.discoverable_by_phone = fields.discoverableByPhone;
  if (fields.suggestToOthers !== undefined) update.suggest_to_others = fields.suggestToOthers;
  if (fields.hideSensitiveContent !== undefined) update.hide_sensitive_content = fields.hideSensitiveContent;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) throw error;

  revalidatePath("/settings");
  revalidatePath("/home");
}

export interface MutedWordRow {
  id: string;
  phrase: string;
}

export async function getMutedWordsAction(): Promise<MutedWordRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("muted_words")
    .select("id, phrase")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

const MAX_MUTED_WORD_LENGTH = 40;
const MAX_MUTED_WORDS = 50;

export async function addMutedWordAction(phrase: string): Promise<MutedWordRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = phrase.trim().toLowerCase().slice(0, MAX_MUTED_WORD_LENGTH);
  if (!trimmed) throw new Error("Enter a word or phrase.");

  const { count } = await supabase
    .from("muted_words")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_MUTED_WORDS) throw new Error("You've reached the muted-word limit.");

  const { data, error } = await supabase
    .from("muted_words")
    .insert({ user_id: user.id, phrase: trimmed })
    .select("id, phrase")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("Already muted.");
    throw error;
  }

  revalidatePath("/settings");
  return data;
}

export async function removeMutedWordAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("muted_words").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/settings");
}
