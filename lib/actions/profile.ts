"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  snapchat?: string;
  youtube?: string;
  twitch?: string;
  discord?: string;
  threads?: string;
  linkedin?: string;
  spotify?: string;
  github?: string;
  pinterest?: string;
  duolingo?: string;
  website?: string;
  [key: string]: string | undefined;
}

const PLATFORMS: (keyof SocialLinks)[] = [
  "instagram",
  "tiktok",
  "twitter",
  "snapchat",
  "youtube",
  "twitch",
  "discord",
  "threads",
  "linkedin",
  "spotify",
  "github",
  "pinterest",
  "duolingo",
  "website",
];
const MAX_LINK_LENGTH = 200;
const MAX_BIO_LENGTH = 160;

// Users paste their actual profile link (each app already gives them one);
// we just store it and use it verbatim as the href. The only cleanup is
// trimming, dropping a stray leading "@", and adding a scheme if they
// pasted a bare domain like "instagram.com/name".
function normalizeLink(raw: string): string {
  let value = raw.trim().replace(/^@/, "").slice(0, MAX_LINK_LENGTH);
  if (value && !/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }
  return value;
}

export async function updateProfileCardAction(bio: string, socialLinks: SocialLinks) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmedBio = bio.trim().slice(0, MAX_BIO_LENGTH);

  const cleanLinks: SocialLinks = {};
  for (const platform of PLATFORMS) {
    const raw = socialLinks[platform];
    if (!raw) continue;
    const value = normalizeLink(raw);
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
