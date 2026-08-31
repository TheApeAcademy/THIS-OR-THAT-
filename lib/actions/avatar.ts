"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const RPM_MODEL_HOST = "models.readyplayer.me";
const RPM_ID_PATTERN = /^[a-f0-9]{24}$/i;

function assertValidRpmModelUrl(glbUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(glbUrl);
  } catch {
    throw new Error("Invalid avatar model URL");
  }
  if (parsed.protocol !== "https:" || parsed.hostname !== RPM_MODEL_HOST) {
    throw new Error("Invalid avatar model URL");
  }
  const match = parsed.pathname.match(/^\/([a-f0-9]{24})\.glb$/i);
  if (!match) throw new Error("Invalid avatar model URL");
}

function buildSnapshotUrl(avatarId: string): string {
  return `https://${RPM_MODEL_HOST}/${avatarId}.png?scene=fullbody-portrait-v1&quality=80`;
}

export async function updateAvatar3DAction(glbUrl: string, avatarId: string) {
  if (!RPM_ID_PATTERN.test(avatarId)) throw new Error("Invalid avatar id");
  assertValidRpmModelUrl(glbUrl);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: buildSnapshotUrl(avatarId),
      avatar_model_url: glbUrl,
      avatar_renderer: "readyplayerme",
      avatar_meta: { rpmAvatarId: avatarId, exportedAt: new Date().toISOString() },
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
