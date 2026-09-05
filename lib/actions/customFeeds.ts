"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_FEED_NAME = 40;

export interface CustomFeedRow {
  id: string;
  name: string;
  topics: { id: string; slug: string; label: string }[];
}

export async function getCustomFeedsAction(): Promise<CustomFeedRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("custom_feeds")
    .select("id, name, custom_feed_topics(topics(id, slug, label))")
    .eq("user_id", user.id)
    .order("created_at")
    .returns<{ id: string; name: string; custom_feed_topics: { topics: { id: string; slug: string; label: string } | null }[] }[]>();

  return (data ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    topics: f.custom_feed_topics.map((t) => t.topics).filter((t): t is { id: string; slug: string; label: string } => !!t),
  }));
}

export async function createCustomFeedAction(name: string, topicIds: string[]) {
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
    .select("id")
    .single();
  if (error) throw error;

  const { error: topicsError } = await supabase
    .from("custom_feed_topics")
    .insert(topicIds.map((topicId) => ({ custom_feed_id: feed.id, topic_id: topicId })));
  if (topicsError) throw topicsError;

  revalidatePath("/feeds");
  revalidatePath("/discover");
  return feed.id as string;
}

export async function deleteCustomFeedAction(customFeedId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("custom_feeds")
    .delete()
    .eq("id", customFeedId)
    .eq("user_id", user.id);
  if (error) throw error;

  revalidatePath("/feeds");
  revalidatePath("/discover");
}
