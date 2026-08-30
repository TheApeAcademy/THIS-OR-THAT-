"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateComparisonInput {
  categoryId: string | null;
  prompt: string | null;
  optionA: { label: string; imageUrl: string | null };
  optionB: { label: string; imageUrl: string | null };
}

const MAX_LABEL_LENGTH = 60;
const MAX_PROMPT_LENGTH = 200;

export async function createComparisonAction(input: CreateComparisonInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const labelA = input.optionA.label.trim();
  const labelB = input.optionB.label.trim();
  const prompt = input.prompt?.trim() || null;

  if (!labelA || !labelB) {
    throw new Error("Both options need a label.");
  }
  if (labelA.length > MAX_LABEL_LENGTH || labelB.length > MAX_LABEL_LENGTH) {
    throw new Error(`Options must be ${MAX_LABEL_LENGTH} characters or fewer.`);
  }
  if (labelA.toLowerCase() === labelB.toLowerCase()) {
    throw new Error("Option A and Option B can't be the same.");
  }
  if (prompt && prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`The question must be ${MAX_PROMPT_LENGTH} characters or fewer.`);
  }

  const { data: comparison, error: comparisonError } = await supabase
    .from("comparisons")
    .insert({
      creator_id: user.id,
      category_id: input.categoryId,
      prompt,
    })
    .select("id")
    .single();

  if (comparisonError) {
    if (comparisonError.code === "42501" || comparisonError.message?.includes("row-level security")) {
      throw new Error("You've created a lot of comparisons today — try again tomorrow.");
    }
    throw comparisonError;
  }

  const { error: optionsError } = await supabase.from("comparison_options").insert([
    { comparison_id: comparison.id, side: "a", label: labelA, image_url: input.optionA.imageUrl },
    { comparison_id: comparison.id, side: "b", label: labelB, image_url: input.optionB.imageUrl },
  ]);

  if (optionsError) throw optionsError;

  return comparison.id as string;
}
