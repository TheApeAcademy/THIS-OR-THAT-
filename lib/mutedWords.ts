import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function getMutedWords(supabase: SupabaseClient<Database>, userId: string): Promise<string[]> {
  const { data } = await supabase.from("muted_words").select("phrase").eq("user_id", userId);
  return (data ?? []).map((r) => r.phrase);
}

/** Reduce/hide check — a muted word matches as a case-insensitive substring. */
export function containsMutedWord(text: string | null | undefined, mutedWords: string[]): boolean {
  if (!text || mutedWords.length === 0) return false;
  const lower = text.toLowerCase();
  return mutedWords.some((w) => lower.includes(w));
}
