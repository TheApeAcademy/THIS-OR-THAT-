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
    const { error } = await supabase
      .from("topic_follows")
      .insert({ user_id: user.id, topic_id: topicId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("topic_follows")
      .delete()
      .eq("user_id", user.id)
      .eq("topic_id", topicId);
    if (error) throw error;
  }

  revalidatePath("/discover");
  revalidatePath("/search");
}
