"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertOwner(comparisonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: comparison, error } = await supabase
    .from("comparisons")
    .select("id, creator_id")
    .eq("id", comparisonId)
    .single();
  if (error) throw error;
  if (comparison.creator_id !== user.id) throw new Error("Not your debate.");

  return { supabase, user };
}

// Only one pinned debate per profile at a time - the common, simplest
// version of this pattern (pinning a second one replaces the first).
export async function togglePinAction(comparisonId: string, pin: boolean) {
  const { supabase, user } = await assertOwner(comparisonId);

  if (pin) {
    await supabase.from("comparisons").update({ pinned_at: null }).eq("creator_id", user.id).not("id", "eq", comparisonId);
  }
  const { error } = await supabase
    .from("comparisons")
    .update({ pinned_at: pin ? new Date().toISOString() : null })
    .eq("id", comparisonId);
  if (error) throw error;

  revalidatePath(`/comparison/${comparisonId}`);
  revalidatePath("/profile");
}

export async function toggleCommentsLockedAction(comparisonId: string, locked: boolean) {
  const { supabase } = await assertOwner(comparisonId);

  const { error } = await supabase.from("comparisons").update({ comments_locked: locked }).eq("id", comparisonId);
  if (error) throw error;

  revalidatePath(`/comparison/${comparisonId}`);
}

export interface VoterRow {
  userId: string;
  username: string;
  avatarUrl: string | null;
  optionLabel: string;
}

export async function getVotersAction(comparisonId: string): Promise<VoterRow[]> {
  const { supabase } = await assertOwner(comparisonId);

  const { data, error } = await supabase
    .from("votes")
    .select(
      "created_at, profiles(id, username, avatar_url, profile_photo_url), comparison_options!votes_option_id_fkey(label)"
    )
    .eq("comparison_id", comparisonId)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<
      {
        created_at: string;
        profiles: { id: string; username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
        comparison_options: { label: string } | null;
      }[]
    >();
  if (error) throw error;

  return (data ?? [])
    .filter((v) => v.profiles)
    .map((v) => ({
      userId: v.profiles!.id,
      username: v.profiles!.username,
      avatarUrl: v.profiles!.profile_photo_url ?? v.profiles!.avatar_url,
      optionLabel: v.comparison_options?.label ?? "?",
    }));
}
