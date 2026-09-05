"use server";

import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import type { ComparisonCardData } from "@/components/ComparisonCard";

export interface TopicSearchResult {
  id: string;
  slug: string;
  label: string;
  followerCount: number;
}

export async function searchComparisonsAction(query: string): Promise<ComparisonCardData[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("comparisons")
    .select(
      "id, prompt, view_count, expires_at, is_sponsored, sponsor_label, comparison_hashtags(hashtags(tag)), comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count, statement, claimant:profiles!comparison_options_claimed_by_fkey(username, avatar_url, profile_photo_url))"
    )
    .eq("status", "active")
    .ilike("prompt", `%${trimmed}%`)
    .order("vote_count", { ascending: false })
    .limit(15)
    .returns<RawComparisonWithOptions[]>();

  if (error) throw error;

  const ids = (data ?? []).map((c) => c.id);
  const { data: myVotes } = user && ids.length
    ? await supabase.from("votes").select("comparison_id, option_id").in("comparison_id", ids)
    : { data: [] };
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  return (data ?? [])
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c): c is ComparisonCardData => c !== null);
}

export async function searchTopicsAction(query: string): Promise<TopicSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, slug, label, follower_count")
    .ilike("label", `%${trimmed}%`)
    .order("follower_count", { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    label: t.label,
    followerCount: t.follower_count,
  }));
}

const MAX_SEARCH_QUERY = 100;

export async function recordSearchAction(query: string) {
  const trimmed = query.trim().slice(0, MAX_SEARCH_QUERY);
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("search_history").insert({ user_id: user.id, query: trimmed });
}

export async function getRecentSearchesAction(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("search_history")
    .select("query")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const row of data ?? []) {
    const q = row.query.toLowerCase();
    if (seen.has(q)) continue;
    seen.add(q);
    unique.push(row.query);
    if (unique.length >= 8) break;
  }
  return unique;
}

export async function clearSearchHistoryAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("search_history").delete().eq("user_id", user.id);
  if (error) throw error;
}
