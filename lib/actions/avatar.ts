"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function assertOwnStorageUrl(url: string, userId: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid avatar URL");
  }
  if (!parsed.hostname.endsWith(".supabase.co")) {
    throw new Error("Invalid avatar URL");
  }
  const expectedPrefix = `/storage/v1/object/public/avatars/${userId}/`;
  if (!parsed.pathname.includes(expectedPrefix)) {
    throw new Error("Avatar URL does not belong to this user");
  }
}

export async function updateAvatar3DAction(
  modelUrl: string,
  headshotUrl: string,
  fullbodyUrl: string,
  avatarId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  assertOwnStorageUrl(modelUrl, user.id);
  assertOwnStorageUrl(headshotUrl, user.id);
  assertOwnStorageUrl(fullbodyUrl, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: headshotUrl,
      avatar_model_url: modelUrl,
      avatar_fullbody_url: fullbodyUrl,
      avatar_renderer: "avaturn",
      avatar_meta: { avaturnAvatarId: avatarId, exportedAt: new Date().toISOString() },
      avatar_upgraded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
  revalidatePath("/card");
  revalidatePath("/home");
}

export async function dismissAvatarUpgradePromptAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_upgrade_prompt_dismissed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
}
