"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

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
  return { supabase, adminId: user.id };
}

async function logAdminAction(
  supabase: SupabaseClient<Database>,
  adminId: string,
  actionType: string,
  targetType: string,
  targetId: string,
  reason?: string | null
) {
  // Best-effort — a logging hiccup shouldn't block the moderation action itself.
  await supabase
    .from("admin_actions")
    .insert({ admin_id: adminId, action_type: actionType, target_type: targetType, target_id: targetId, reason });
}

export async function resolveReportAction(reportId: string, status: "resolved" | "dismissed") {
  const { supabase, adminId } = await requireAdmin();

  const { error } = await supabase
    .from("reports")
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: adminId })
    .eq("id", reportId);

  if (error) throw error;
  await logAdminAction(supabase, adminId, `report_${status}`, "report", reportId);
  revalidatePath("/admin");
}

export async function removeCommentAction(commentId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase.from("comments").update({ status: "removed" }).eq("id", commentId);
  if (error) throw error;
  await logAdminAction(supabase, adminId, "remove_comment", "comment", commentId);
  revalidatePath("/admin");
}

export async function removeComparisonAction(comparisonId: string) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("comparisons")
    .update({ status: "removed" })
    .eq("id", comparisonId);
  if (error) throw error;
  await logAdminAction(supabase, adminId, "remove_comparison", "comparison", comparisonId);
  revalidatePath("/admin");
}

export async function setUserSuspendedAction(userId: string, suspended: boolean) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq("id", userId);
  if (error) throw error;
  await logAdminAction(supabase, adminId, suspended ? "suspend_user" : "unsuspend_user", "profile", userId);
  revalidatePath("/admin");
}

export async function setSponsoredAction(comparisonId: string, sponsored: boolean, sponsorLabel: string | null) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("comparisons")
    .update({ is_sponsored: sponsored, sponsor_label: sponsored ? sponsorLabel?.trim().slice(0, 60) || null : null })
    .eq("id", comparisonId);
  if (error) throw error;
  await logAdminAction(
    supabase,
    adminId,
    sponsored ? "sponsor_comparison" : "unsponsor_comparison",
    "comparison",
    comparisonId,
    sponsorLabel
  );
  revalidatePath(`/comparison/${comparisonId}`);
  revalidatePath("/home");
}

export type VerificationType = "none" | "identity" | "social";

export interface AdminUserSearchResult {
  id: string;
  username: string;
  verificationType: VerificationType;
}

export async function adminSearchUsersAction(query: string): Promise<AdminUserSearchResult[]> {
  const { supabase } = await requireAdmin();
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, username, verification_type")
    .ilike("username", `%${trimmed}%`)
    .limit(10);

  return (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    verificationType: p.verification_type as VerificationType,
  }));
}

export async function setVerificationAction(userId: string, type: VerificationType) {
  const { supabase, adminId } = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ verification_type: type, verified_at: type === "none" ? null : new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
  await logAdminAction(supabase, adminId, `verify_${type}`, "profile", userId);
  revalidatePath("/admin");
}

export interface AdminActionRow {
  id: string;
  adminUsername: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
}

export async function getAdminAuditLogAction(): Promise<AdminActionRow[]> {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("admin_actions")
    .select("id, action_type, target_type, target_id, reason, created_at, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<
      {
        id: string;
        action_type: string;
        target_type: string;
        target_id: string;
        reason: string | null;
        created_at: string;
        profiles: { username: string } | null;
      }[]
    >();

  return (data ?? []).map((r) => ({
    id: r.id,
    adminUsername: r.profiles?.username ?? "unknown",
    actionType: r.action_type,
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    createdAt: r.created_at,
  }));
}

export interface AdminDailyStat {
  day: string;
  newSignups: number;
  votes: number;
  comments: number;
  comparisonsCreated: number;
  activeUsers: number;
}

export interface AdminSummaryStats {
  totalUsers: number;
  totalComparisons: number;
  totalVotes: number;
  dau: number;
  wau: number;
  mau: number;
}

export async function getAdminMetricsAction(): Promise<{
  daily: AdminDailyStat[];
  summary: AdminSummaryStats | null;
}> {
  const { supabase } = await requireAdmin();

  const [{ data: dailyRows }, { data: summaryRows }] = await Promise.all([
    supabase.rpc("get_admin_daily_stats", { p_days: 14 }),
    supabase.rpc("get_admin_summary_stats"),
  ]);

  const daily: AdminDailyStat[] = (dailyRows ?? []).map((r) => ({
    day: r.day,
    newSignups: r.new_signups,
    votes: r.votes,
    comments: r.comments,
    comparisonsCreated: r.comparisons_created,
    activeUsers: r.active_users,
  }));

  const s = summaryRows?.[0];
  const summary: AdminSummaryStats | null = s
    ? {
        totalUsers: s.total_users,
        totalComparisons: s.total_comparisons,
        totalVotes: s.total_votes,
        dau: s.dau,
        wau: s.wau,
        mau: s.mau,
      }
    : null;

  return { daily, summary };
}
