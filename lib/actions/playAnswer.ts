"use server";

import { createClient } from "@/lib/supabase/server";

export async function recordPlayAnswerAction(comparisonId: string, subject: string, correct: boolean | null) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_play_answer", {
    p_comparison_id: comparisonId,
    p_subject: subject,
    p_correct: correct,
  });
  if (error) throw error;
}

export async function recordPredictionAction(comparisonId: string, predictedOptionId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_prediction", {
    p_comparison_id: comparisonId,
    p_predicted_option_id: predictedOptionId,
  });
  if (error) throw error;
  return !!data;
}
