"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Visibility = "public" | "followers" | "private";

export interface PrivacySettings {
  cardVisibility: Visibility;
  preferenceVisibility: Visibility;
  socialLinksVisibility: Visibility;
  compatibilityVisibility: Visibility;
}

export async function updatePrivacyAction(settings: Partial<PrivacySettings>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const update: {
    card_visibility?: Visibility;
    preference_visibility?: Visibility;
    social_links_visibility?: Visibility;
    compatibility_visibility?: Visibility;
  } = {};
  if (settings.cardVisibility) update.card_visibility = settings.cardVisibility;
  if (settings.preferenceVisibility) update.preference_visibility = settings.preferenceVisibility;
  if (settings.socialLinksVisibility) update.social_links_visibility = settings.socialLinksVisibility;
  if (settings.compatibilityVisibility) update.compatibility_visibility = settings.compatibilityVisibility;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) throw error;

  revalidatePath("/settings");
  revalidatePath("/card");
}

export type DataConsent =
  | "none"
  | "anonymous"
  | "aggregated"
  | "personalized"
  | "advertising"
  | "research"
  | "licensing";

export async function updateDataConsentAction(consent: DataConsent) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("profiles").update({ data_consent: consent }).eq("id", user.id);
  if (error) throw error;

  revalidatePath("/settings");
  revalidatePath("/home");
}

export async function updateCountryAction(country: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ country: country || null })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/settings");
}

export async function updateCategoryWeightAction(categoryId: string, weight: -1 | 0 | 1) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("category_feed_prefs")
    .upsert(
      { user_id: user.id, category_id: categoryId, weight, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category_id" }
    );
  if (error) throw error;

  revalidatePath("/settings");
  revalidatePath("/home");
}

export async function setDeactivatedAction(deactivated: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ deactivated_at: deactivated ? new Date().toISOString() : null })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/settings");
}

export async function exportMyDataAction(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [profile, votes, comments, comparisons, dna, saves, follows] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("votes").select("comparison_id, option_id, created_at").eq("user_id", user.id),
    supabase.from("comments").select("id, comparison_id, body, created_at").eq("user_id", user.id),
    supabase.from("comparisons").select("id, prompt, caption, created_at").eq("creator_id", user.id),
    supabase.from("preference_dna").select("breakdown, updated_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("saved_comparisons").select("comparison_id, created_at").eq("user_id", user.id),
    supabase.from("follows").select("followee_id, created_at").eq("follower_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    votes: votes.data ?? [],
    comments: comments.data ?? [],
    comparisons_created: comparisons.data ?? [],
    preference_dna: dna.data ?? null,
    saved_comparisons: saves.data ?? [],
    following: follows.data ?? [],
  };

  return JSON.stringify(payload, null, 2);
}
