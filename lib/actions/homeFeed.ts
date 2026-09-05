"use server";

import { createClient } from "@/lib/supabase/server";
import { getMutedWords } from "@/lib/mutedWords";
import { buildFeedCards } from "@/lib/homeFeedBuilder";
import type { FeedComparisonData } from "@/lib/feedComparisons";

const FEED_SIZE = 30;

async function feedContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, mutedWords] = await Promise.all([
    user
      ? supabase.from("profiles").select("hide_sensitive_content").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user ? getMutedWords(supabase, user.id) : Promise.resolve([] as string[]),
  ]);
  return { supabase, user, hideSensitive: profile?.hide_sensitive_content ?? true, mutedWords };
}

export async function getFollowingFeedAction(): Promise<FeedComparisonData[]> {
  const { supabase, user, hideSensitive, mutedWords } = await feedContext();
  if (!user) return [];

  const { data: followRows } = await supabase.from("follows").select("followee_id").eq("follower_id", user.id);
  const followeeIds = (followRows ?? []).map((f) => f.followee_id);
  if (followeeIds.length === 0) return [];

  const { data: rows } = await supabase
    .from("comparisons")
    .select("id")
    .eq("status", "active")
    .in("creator_id", followeeIds)
    .order("created_at", { ascending: false })
    .limit(FEED_SIZE);

  return buildFeedCards(supabase, user.id, (rows ?? []).map((r) => r.id), mutedWords, hideSensitive);
}

export async function getLatestFeedAction(): Promise<FeedComparisonData[]> {
  const { supabase, user, hideSensitive, mutedWords } = await feedContext();

  const { data: rows } = await supabase
    .from("comparisons")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(FEED_SIZE);

  return buildFeedCards(supabase, user?.id ?? null, (rows ?? []).map((r) => r.id), mutedWords, hideSensitive);
}

export async function getTrendingFeedAction(): Promise<FeedComparisonData[]> {
  const { supabase, user, hideSensitive, mutedWords } = await feedContext();

  const { data: rows } = await supabase.rpc("get_trending_comparisons", { p_limit: FEED_SIZE });

  return buildFeedCards(
    supabase,
    user?.id ?? null,
    (rows ?? []).map((r) => r.comparison_id),
    mutedWords,
    hideSensitive
  );
}
