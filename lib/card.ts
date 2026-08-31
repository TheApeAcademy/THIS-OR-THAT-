import { createClient } from "@/lib/supabase/server";

export async function ensureCard(userId: string): Promise<string> {
  const supabase = await createClient();

  const [{ data: profile }, { data: dna }] = await Promise.all([
    supabase.from("profiles").select("username, display_name").eq("id", userId).single(),
    supabase.from("preference_dna").select("breakdown").eq("user_id", userId).maybeSingle(),
  ]);

  const snapshot = {
    username: profile?.username,
    displayName: profile?.display_name,
    breakdown: dna?.breakdown ?? {},
  };

  const { data: existing } = await supabase
    .from("cards")
    .select("id, share_slug")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("cards").update({ snapshot }).eq("id", existing.id);
    if (error) throw error;
    return existing.share_slug;
  }

  const { data: created, error } = await supabase
    .from("cards")
    .insert({ user_id: userId, snapshot })
    .select("share_slug")
    .single();

  if (error) throw error;
  return created.share_slug;
}
