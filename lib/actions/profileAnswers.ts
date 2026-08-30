"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_ANSWER_LENGTH = 500;

export async function saveProfileAnswersAction(answers: Record<string, string>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const now = new Date().toISOString();
  const toUpsert = Object.entries(answers)
    .map(([questionKey, raw]) => ({ questionKey, answer: raw.trim().slice(0, MAX_ANSWER_LENGTH) }))
    .filter((a) => a.answer.length > 0)
    .map((a) => ({ user_id: user.id, question_key: a.questionKey, answer: a.answer, updated_at: now }));

  const emptyKeys = Object.entries(answers)
    .filter(([, raw]) => !raw.trim())
    .map(([key]) => key);

  if (toUpsert.length > 0) {
    const { error } = await supabase.from("profile_answers").upsert(toUpsert, { onConflict: "user_id,question_key" });
    if (error) throw error;
  }
  if (emptyKeys.length > 0) {
    await supabase.from("profile_answers").delete().eq("user_id", user.id).in("question_key", emptyKeys);
  }

  revalidatePath("/profile");
}
