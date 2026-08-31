"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { usernameTier, type UsernameTier } from "@/lib/username";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export interface UsernameCheckResult {
  valid: boolean;
  available: boolean;
  tier: UsernameTier;
  price: number | null;
  reason?: string;
}

export async function checkUsernameAction(raw: string): Promise<UsernameCheckResult> {
  const username = raw.trim().toLowerCase();
  const { tier, price } = usernameTier(username);

  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      available: false,
      tier,
      price,
      reason: "3-20 characters, lowercase letters, numbers, and underscores only.",
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();

  return {
    valid: true,
    available: !existing,
    tier,
    price,
    reason: existing ? "That username is already taken." : undefined,
  };
}

export async function updateUsernameAction(raw: string) {
  const username = raw.trim().toLowerCase();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("3-20 characters, lowercase letters, numbers, and underscores only.");
  }

  const { tier } = usernameTier(username);
  if (tier !== "free") {
    throw new Error("Premium usernames aren't purchasable yet — payments are launching soon.");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) throw new Error("That username is already taken.");

  const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
  revalidatePath("/card");
  revalidatePath("/home");
}
