"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportTargetType = "comment" | "comparison" | "profile";
export type ReportReason = "spam" | "harassment" | "inappropriate" | "misinformation" | "other";

export async function reportContentAction(
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  details?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details?.trim().slice(0, 500) || null,
  });

  if (error) throw error;
}
