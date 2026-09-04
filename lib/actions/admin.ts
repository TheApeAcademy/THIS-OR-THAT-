"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Not authorized");
  return supabase;
}

export async function resolveReportAction(reportId: string, status: "resolved" | "dismissed") {
  const supabase = await requireAdmin();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: user!.id })
    .eq("id", reportId);

  if (error) throw error;
  revalidatePath("/admin");
}

export async function removeCommentAction(commentId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("comments").update({ status: "removed" }).eq("id", commentId);
  if (error) throw error;
  revalidatePath("/admin");
}

export async function removeComparisonAction(comparisonId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("comparisons")
    .update({ status: "removed" })
    .eq("id", comparisonId);
  if (error) throw error;
  revalidatePath("/admin");
}

export async function setUserSuspendedAction(userId: string, suspended: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) throw error;
  revalidatePath("/admin");
}

export async function setSponsoredAction(comparisonId: string, sponsored: boolean, sponsorLabel: string | null) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("comparisons")
    .update({ is_sponsored: sponsored, sponsor_label: sponsored ? sponsorLabel?.trim().slice(0, 60) || null : null })
    .eq("id", comparisonId);
  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/comparison/[id]", "page");
}
