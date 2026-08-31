"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_AVATAR_LENGTH = 30000;

export async function updateAvatarAction(dataUri: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!dataUri.startsWith("data:image/svg+xml") || dataUri.length > MAX_AVATAR_LENGTH) {
    throw new Error("Invalid avatar");
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: dataUri }).eq("id", user.id);
  if (error) throw error;

  revalidatePath("/profile");
  revalidatePath("/card");
  revalidatePath("/home");
}
