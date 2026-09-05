"use server";

import { createClient } from "@/lib/supabase/server";
import { getMutedWords } from "@/lib/mutedWords";
import { buildFeedCards } from "@/lib/homeFeedBuilder";
import type { FeedComparisonData } from "@/lib/feedComparisons";

const FEED_SIZE = 30;

export async function getForYouFeedAction(): Promise<FeedComparisonData[]> {
  const { supabase, user, hideSensitive, mutedWords } = await feedContext();

  const [{ data: orderRows }, { data: repostRows }] = await Promise.all([
    supabase.rpc("get_feed_order", { p_user_id: user?.id ?? undefined, p_limit: FEED_SIZE }),
    user
      ? supabase.rpc("get_recent_reposts_from_followed", { p_user_id: user.id, p_limit: 5 })
      : Promise.resolve({ data: [] }),
  ]);

  const repostedByMap = new Map((repostRows ?? []).map((r) => [r.comparison_id, r.reposter_username]));
  const repostIds = (repostRows ?? []).map((r) => r.comparison_id);
  const rankedIds = (orderRows ?? []).map((r) => r.comparison_id).filter((id) => !repostedByMap.has(id));
  const orderedIds = [...repostIds, ...rankedIds];

  return buildFeedCards(supabase, user?.id ?? null, orderedIds, mutedWords, hideSensitive, repostedByMap);
}

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
