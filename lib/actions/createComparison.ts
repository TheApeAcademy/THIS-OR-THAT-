"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateComparisonInput {
  categoryId: string | null;
  prompt: string | null;
  optionA: { label: string; imageUrl: string | null };
  optionB: { label: string; imageUrl: string | null };
}

export async function createComparisonAction(input: CreateComparisonInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: comparison, error: comparisonError } = await supabase
    .from("comparisons")
    .insert({
      creator_id: user.id,
      category_id: input.categoryId,
      prompt: input.prompt,
    })
    .select("id")
    .single();

  if (comparisonError) throw comparisonError;

  const { error: optionsError } = await supabase.from("comparison_options").insert([
    { comparison_id: comparison.id, side: "a", label: input.optionA.label, image_url: input.optionA.imageUrl },
    { comparison_id: comparison.id, side: "b", label: input.optionB.label, image_url: input.optionB.imageUrl },
  ]);

  if (optionsError) throw optionsError;

  return comparison.id as string;
}
