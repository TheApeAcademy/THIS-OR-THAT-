"use server";

import { createClient } from "@/lib/supabase/server";

export async function recordPlayAnswerAction(comparisonId: string, subject: string, correct: boolean | null) {
  // Classic-mode comparisons have no right/wrong answer — nothing to record.
  if (correct === null) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_play_answer", {
    p_comparison_id: comparisonId,
    p_subject: subject,
    p_correct: correct,
  });
  if (error) throw error;
}
