"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleTopicFollowAction(topicId: string, follow: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (follow) {
    const { error } = await supabase.from("topic_follows").insert({ topic_id: topicId, user_id: user.id });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("topic_follows")
      .delete()
      .eq("topic_id", topicId)
      .eq("user_id", user.id);
    if (error) throw error;
  }

  revalidatePath("/search");
  revalidatePath("/feeds");
}

export interface FollowedTopic {
  id: string;
  slug: string;
  label: string;
}

export async function getFollowedTopicsAction(): Promise<FollowedTopic[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("topic_follows")
    .select("topics(id, slug, label)")
    .eq("user_id", user.id)
    .returns<{ topics: FollowedTopic | null }[]>();

  return (data ?? []).map((r) => r.topics).filter((t): t is FollowedTopic => !!t);
}
