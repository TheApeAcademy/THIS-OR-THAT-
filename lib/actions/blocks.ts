"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleBlockAction(targetUserId: string, block: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("Can't block yourself");

  if (block) {
    const { error } = await supabase
      .from("blocks")
      .insert({ blocker_id: user.id, blocked_id: targetUserId });
    if (error && error.code !== "23505") throw error;

    // Blocking implies unfollowing in both directions — a block should
    // sever the relationship, not just silence the feed.
    await supabase
      .from("follows")
      .delete()
      .or(
        `and(follower_id.eq.${user.id},followee_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},followee_id.eq.${user.id})`
      );
  } else {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", targetUserId);
    if (error) throw error;
  }

  revalidatePath("/home");
  revalidatePath("/discover");
  revalidatePath("/profile");
}

export async function toggleMuteAction(targetUserId: string, mute: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (user.id === targetUserId) throw new Error("Can't mute yourself");

  if (mute) {
    const { error } = await supabase
      .from("mutes")
      .insert({ muter_id: user.id, muted_id: targetUserId });
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("mutes")
      .delete()
      .eq("muter_id", user.id)
      .eq("muted_id", targetUserId);
    if (error) throw error;
  }

  revalidatePath("/home");
  revalidatePath("/discover");
  revalidatePath("/profile");
}
