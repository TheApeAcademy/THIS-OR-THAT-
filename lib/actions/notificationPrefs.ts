"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const NOTIFICATION_CATEGORIES = [
  { key: "likes", label: "Likes", types: ["like_comparison", "like_card"] },
  { key: "comments", label: "Comments & replies", types: ["comment_comparison", "comment_card", "reply_comment"] },
  { key: "follows", label: "New followers", types: ["follow"] },
  { key: "mentions", label: "Mentions", types: ["mention"] },
  { key: "card_views", label: "Card views", types: ["card_view"] },
  { key: "debate_results", label: "Debate results", types: ["debate_result"] },
  {
    key: "duels",
    label: "Duels",
    types: ["duel_challenge_received", "duel_challenge_accepted", "duel_challenge_declined"],
  },
] as const;

export type NotificationCategoryKey = (typeof NOTIFICATION_CATEGORIES)[number]["key"];

export async function updateNotificationPrefsAction(mutedCategories: NotificationCategoryKey[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const mutedTypes = NOTIFICATION_CATEGORIES.filter((c) => mutedCategories.includes(c.key)).flatMap((c) => c.types);

  const { error } = await supabase
    .from("profiles")
    .update({ muted_notification_types: mutedTypes })
    .eq("id", user.id);
  if (error) throw error;

  revalidatePath("/notifications", "layout");
}
