"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export async function searchUsersAction(query: string): Promise<UserSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, profile_photo_url")
    .ilike("username", `%${trimmed}%`)
    .neq("id", user?.id ?? "00000000-0000-0000-0000-000000000000")
    .eq("is_seed_account", false)
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.profile_photo_url ?? p.avatar_url,
  }));
}
