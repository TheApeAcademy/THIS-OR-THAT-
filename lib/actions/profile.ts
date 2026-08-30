"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
  website?: string;
  linkedin?: string;
  spotify?: string;
  duolingo?: string;
  [key: string]: string | undefined;
}

const PLATFORMS: (keyof SocialLinks)[] = [
  "instagram",
  "tiktok",
  "twitter",
  "snapchat",
  "linkedin",
  "spotify",
  "duolingo",
  "website",
];
const MAX_HANDLE_LENGTH = 60;
const MAX_BIO_LENGTH = 160;

export async function updateProfileCardAction(bio: string, socialLinks: SocialLinks) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmedBio = bio.trim().slice(0, MAX_BIO_LENGTH);

  const cleanLinks: SocialLinks = {};
  for (const platform of PLATFORMS) {
    const value = socialLinks[platform]?.trim().replace(/^@/, "").slice(0, MAX_HANDLE_LENGTH);
    if (value) cleanLinks[platform] = value;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ bio: trimmedBio || null, social_links: cleanLinks })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/profile");
  revalidatePath("/card");
}

export async function updateShowPlayScoreAction(show: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("profiles").update({ show_play_score: show }).eq("id", user.id);
  if (error) throw error;
  revalidatePath("/profile");
  revalidatePath("/card");
}
