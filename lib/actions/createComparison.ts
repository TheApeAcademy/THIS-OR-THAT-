"use server";

import { createClient } from "@/lib/supabase/server";
import { attachHashtags } from "@/lib/actions/hashtags";
import { parseHashtags } from "@/lib/hashtags";

export type ComparisonVisibility = "public" | "followers";

export interface CreateComparisonInput {
  categoryId: string | null;
  prompt: string | null;
  options: { label: string; imageUrl: string | null }[];
  funFact?: string | null;
  subject?: string | null;
  correctOptionIndex?: number | null;
  visibility?: ComparisonVisibility;
}

const MAX_LABEL_LENGTH = 60;
const MAX_PROMPT_LENGTH = 200;
const MAX_FUN_FACT_LENGTH = 500;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
const SIDES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export async function createComparisonAction(input: CreateComparisonInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (input.options.length < MIN_OPTIONS || input.options.length > MAX_OPTIONS) {
    throw new Error(`A comparison needs between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`);
  }

  const labels = input.options.map((o) => o.label.trim());
  const prompt = input.prompt?.trim() || null;

  if (labels.some((label) => !label)) {
    throw new Error("Every option needs a label.");
  }
  if (labels.some((label) => label.length > MAX_LABEL_LENGTH)) {
    throw new Error(`Options must be ${MAX_LABEL_LENGTH} characters or fewer.`);
  }
  if (new Set(labels.map((l) => l.toLowerCase())).size !== labels.length) {
    throw new Error("Options need to be different from each other.");
  }
  if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`The question must be ${MAX_PROMPT_LENGTH} characters or fewer.`);
  }

  const funFact = input.funFact?.trim().slice(0, MAX_FUN_FACT_LENGTH) || null;
  const subject = input.subject?.trim() || null;
  const correctSide =
    input.correctOptionIndex !== undefined &&
    input.correctOptionIndex !== null &&
    input.correctOptionIndex >= 0 &&
    input.correctOptionIndex < input.options.length
      ? SIDES[input.correctOptionIndex]
      : null;

  const { data: comparison, error: comparisonError } = await supabase
    .from("comparisons")
    .insert({
      creator_id: user.id,
      category_id: input.categoryId,
      prompt,
      fun_fact: funFact,
      subject,
      correct_side: correctSide,
      visibility: input.visibility ?? "public",
    })
    .select("id")
    .single();

  if (comparisonError) {
    if (comparisonError.code === "42501" || comparisonError.message?.includes("row-level security")) {
      throw new Error("You've created a lot of comparisons today — try again tomorrow.");
    }
    throw comparisonError;
  }

  const { error: optionsError } = await supabase.from("comparison_options").insert(
    input.options.map((option, i) => ({
      comparison_id: comparison.id,
      side: SIDES[i],
      label: labels[i],
      image_url: option.imageUrl,
    }))
  );

  if (optionsError) throw optionsError;

  const tags = parseHashtags(prompt);
  if (tags.length > 0) {
    // Best-effort — a hashtag hiccup shouldn't fail comparison creation.
    await attachHashtags(supabase, comparison.id, tags).catch(() => {});
  }

  return comparison.id as string;
}
