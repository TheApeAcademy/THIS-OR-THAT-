"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateComparisonInput {
  categoryId: string | null;
  prompt: string | null;
  options: { label: string; imageUrl: string | null }[];
  funFact?: string | null;
  subject?: string | null;
  correctOptionIndex?: number | null;
  /** ISO timestamp — poll closes to voting and drops off the feed after this. */
  expiresAt?: string | null;
}

const MAX_LABEL_LENGTH = 60;
const MAX_PROMPT_LENGTH = 200;
const MAX_FUN_FACT_LENGTH = 500;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const SIDES = ["a", "b", "c", "d", "e", "f"];
const MIN_EXPIRY_MINUTES = 10;
const MAX_EXPIRY_DAYS = 30;

function assertOwnComparisonImageUrl(url: string | null, userId: string): void {
  if (url === null) return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid image URL");
  }
  if (!parsed.hostname.endsWith(".supabase.co")) {
    throw new Error("Invalid image URL");
  }
  const expectedPrefix = `/storage/v1/object/public/comparison-images/${userId}/`;
  if (!parsed.pathname.includes(expectedPrefix)) {
    throw new Error("Image URL does not belong to this user");
  }
}

export async function createComparisonAction(input: CreateComparisonInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (input.options.length < MIN_OPTIONS || input.options.length > MAX_OPTIONS) {
    throw new Error(`A comparison needs between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`);
  }

  for (const option of input.options) {
    assertOwnComparisonImageUrl(option.imageUrl, user.id);
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

  let expiresAt: string | null = null;
  if (input.expiresAt) {
    const parsed = new Date(input.expiresAt);
    const minutesOut = (parsed.getTime() - Date.now()) / 60_000;
    if (Number.isNaN(parsed.getTime()) || minutesOut < MIN_EXPIRY_MINUTES) {
      throw new Error("The end time must be at least 10 minutes from now.");
    }
    if (minutesOut > MAX_EXPIRY_DAYS * 24 * 60) {
      throw new Error(`The end time can't be more than ${MAX_EXPIRY_DAYS} days out.`);
    }
    expiresAt = parsed.toISOString();
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
      expires_at: expiresAt,
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

  return comparison.id as string;
}

interface RematchableComparison {
  id: string;
  prompt: string | null;
  category_id: string | null;
  expires_at: string | null;
  created_at: string;
  comparison_options: { side: string; label: string; image_url: string | null }[];
}

/** Starts a fresh round of an expired time-boxed comparison — same
 * prompt/category/options, zeroed vote counts, a new deadline matching the
 * original's duration. Returns the existing rematch's id if one was
 * already started, instead of creating a duplicate. */
export async function createRematchAction(originalComparisonId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existingRematch } = await supabase
    .from("comparisons")
    .select("id")
    .eq("rematch_of_id", originalComparisonId)
    .maybeSingle();
  if (existingRematch) return existingRematch.id;

  const { data: original, error: originalError } = await supabase
    .from("comparisons")
    .select("id, prompt, category_id, expires_at, created_at, comparison_options(side, label, image_url)")
    .eq("id", originalComparisonId)
    .single<RematchableComparison>();
  if (originalError) throw originalError;
  if (!original.expires_at) throw new Error("Only time-boxed debates can be rematched.");

  const originalDurationMs = new Date(original.expires_at).getTime() - new Date(original.created_at).getTime();
  const newExpiresAt = new Date(Date.now() + Math.max(originalDurationMs, MIN_EXPIRY_MINUTES * 60_000)).toISOString();

  const { data: rematch, error: rematchError } = await supabase
    .from("comparisons")
    .insert({
      creator_id: user.id,
      category_id: original.category_id,
      prompt: original.prompt,
      expires_at: newExpiresAt,
      rematch_of_id: originalComparisonId,
    })
    .select("id")
    .single();
  if (rematchError) throw rematchError;

  const options = [...original.comparison_options].sort((a, b) => a.side.localeCompare(b.side));
  const { error: optionsInsertError } = await supabase.from("comparison_options").insert(
    options.map((o) => ({
      comparison_id: rematch.id,
      side: o.side,
      label: o.label,
      image_url: o.image_url,
    }))
  );
  if (optionsInsertError) throw optionsInsertError;

  return rematch.id as string;
}
