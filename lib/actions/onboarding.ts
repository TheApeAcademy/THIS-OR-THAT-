"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { shuffle } from "@/lib/shuffle";

const PER_CATEGORY = 2;

export interface OnboardingOption {
  id: string;
  side: string;
  label: string;
  image_url: string | null;
}

export interface OnboardingComparison {
  id: string;
  prompt: string | null;
  comparison_options: OnboardingOption[];
}

export async function buildOnboardingDeckAction(
  categoryIds: string[]
): Promise<OnboardingComparison[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const picks: OnboardingComparison[] = [];

  for (const categoryId of categoryIds) {
    const { data } = await supabase
      .from("comparisons")
      .select("id, prompt, comparison_options(id, side, label, image_url)")
      .eq("status", "active")
      .eq("category_id", categoryId)
      .limit(40);

    const candidates = (data ?? []).filter((c) => c.comparison_options.length === 2);
    picks.push(...shuffle(candidates).slice(0, PER_CATEGORY));
  }

  return shuffle(picks);
}

export interface OnboardingStats {
  preferencesDiscovered: number;
  votesCast: number;
}

export async function getOnboardingStatsAction(): Promise<OnboardingStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { preferencesDiscovered: 0, votesCast: 0 };

  const { data } = await supabase.rpc("get_onboarding_stats", { p_user_id: user.id });
  const row = data?.[0];
  return {
    preferencesDiscovered: row?.preferences_discovered ?? 0,
    votesCast: row?.votes_cast ?? 0,
  };
}

export async function completeOnboardingAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/home");
}
