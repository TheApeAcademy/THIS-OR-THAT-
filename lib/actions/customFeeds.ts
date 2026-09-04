"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { toComparisonCardData, type RawComparisonWithOptions } from "@/lib/comparisons";
import { getHiddenAuthorIds } from "@/lib/blocks";
import type { ComparisonCardData } from "@/components/ComparisonCard";

export interface CustomFeedRow {
  id: string;
  name: string;
  topicIds: string[];
}

export async function getCustomFeedsAction(): Promise<CustomFeedRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: feeds } = await supabase
    .from("custom_feeds")
    .select("id, name, custom_feed_topics(topic_id)")
    .eq("user_id", user.id)
    .order("created_at")
    .returns<{ id: string; name: string; custom_feed_topics: { topic_id: string }[] }[]>();

  return (feeds ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    topicIds: f.custom_feed_topics.map((t) => t.topic_id),
  }));
}

const MAX_FEED_NAME = 40;

export async function createCustomFeedAction(name: string, topicIds: string[]): Promise<CustomFeedRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = name.trim().slice(0, MAX_FEED_NAME);
  if (!trimmed) throw new Error("Name your feed.");
  if (topicIds.length === 0) throw new Error("Pick at least one topic.");

  const { data: feed, error } = await supabase
    .from("custom_feeds")
    .insert({ user_id: user.id, name: trimmed })
    .select("id, name")
    .single();
  if (error) throw error;

  const { error: joinError } = await supabase
    .from("custom_feed_topics")
    .insert(topicIds.map((topicId) => ({ custom_feed_id: feed.id, topic_id: topicId })));
  if (joinError) throw joinError;

  revalidatePath("/discover");
  return { id: feed.id, name: feed.name, topicIds };
}

export async function deleteCustomFeedAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("custom_feeds").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/discover");
}

interface CustomFeedComparisonRow extends RawComparisonWithOptions {
  creator_id: string | null;
}

export async function getCustomFeedComparisonsAction(id: string): Promise<ComparisonCardData[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: orderRows } = await supabase.rpc("get_custom_feed_comparisons", {
    p_custom_feed_id: id,
    p_limit: 30,
  });
  const ids = (orderRows ?? []).map((r) => r.comparison_id);
  if (ids.length === 0) return [];

  const [{ data: comparisons }, hiddenAuthorIds] = await Promise.all([
    supabase
      .from("comparisons")
      .select("id, prompt, creator_id, comparison_options(id, side, label, image_url, vote_count)")
      .in("id", ids)
      .returns<CustomFeedComparisonRow[]>(),
    getHiddenAuthorIds(supabase, user.id),
  ]);

  const hiddenSet = new Set(hiddenAuthorIds);
  const visible = (comparisons ?? []).filter((c) => !c.creator_id || !hiddenSet.has(c.creator_id));

  const { data: myVotes } = await supabase
    .from("votes")
    .select("comparison_id, option_id")
    .in("comparison_id", ids);
  const votedByComparison = new Map((myVotes ?? []).map((v) => [v.comparison_id, v.option_id]));

  return visible
    .map((c) => toComparisonCardData(c, votedByComparison.get(c.id)))
    .filter((c): c is ComparisonCardData => c !== null);
}
