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

  const { data } = await supabase
    .from("comparisons")
    .select("id, prompt, category_id, comparison_options(id, side, label, image_url)")
    .eq("status", "active")
    .in("category_id", categoryIds);

  const byCategory = new Map<string, OnboardingComparison[]>();
  for (const row of data ?? []) {
    if (row.comparison_options.length !== 2 || !row.category_id) continue;
    const list = byCategory.get(row.category_id) ?? [];
    list.push(row);
    byCategory.set(row.category_id, list);
  }

  const picks: OnboardingComparison[] = [];
  for (const categoryId of categoryIds) {
    const candidates = byCategory.get(categoryId) ?? [];
    picks.push(...shuffle(candidates).slice(0, PER_CATEGORY));
  }

  return shuffle(picks);
}

export async function completeOnboardingAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) throw error;

  redirect("/home");
}
