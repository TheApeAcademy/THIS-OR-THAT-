"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function assertOwnPhotoUrl(url: string, userId: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid photo URL");
  }
  if (!parsed.hostname.endsWith(".supabase.co")) {
    throw new Error("Invalid photo URL");
  }
  const expectedPrefix = `/storage/v1/object/public/profile-photos/${userId}/`;
  if (!parsed.pathname.includes(expectedPrefix)) {
    throw new Error("Photo URL does not belong to this user");
  }
}

export async function updateProfilePhotoAction(photoUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  assertOwnPhotoUrl(photoUrl, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ profile_photo_url: photoUrl })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
  revalidatePath("/card");
  revalidatePath("/home");
}
