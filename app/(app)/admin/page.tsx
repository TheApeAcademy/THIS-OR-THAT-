import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminReportList, type AdminReportRow } from "@/components/AdminReportList";

export const dynamic = "force-dynamic";

interface ReportRow {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  reporter_id: string;
  profiles: { username: string } | null;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!me?.is_admin) redirect("/home");

  const { data: reports } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, details, created_at, reporter_id, profiles!reports_reporter_id_fkey(username)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ReportRow[]>();

  const list = reports ?? [];
  const commentIds = list.filter((r) => r.target_type === "comment").map((r) => r.target_id);
  const comparisonIds = list.filter((r) => r.target_type === "comparison").map((r) => r.target_id);
  const profileIds = list.filter((r) => r.target_type === "profile").map((r) => r.target_id);

  const [{ data: comments }, { data: comparisons }, { data: profiles }] = await Promise.all([
    commentIds.length
      ? supabase.from("comments").select("id, body, status, user_id, profiles(username)").in("id", commentIds)
      : Promise.resolve({ data: [] as { id: string; body: string; status: string; user_id: string; profiles: { username: string } | null }[] }),
    comparisonIds.length
      ? supabase
          .from("comparisons")
          .select("id, prompt, status, creator_id, comparison_options(side, label)")
          .in("id", comparisonIds)
      : Promise.resolve({
          data: [] as {
            id: string;
            prompt: string | null;
            status: string;
            creator_id: string | null;
            comparison_options: { side: string; label: string }[];
          }[],
        }),
    profileIds.length
      ? supabase.from("profiles").select("id, username, suspended_at").in("id", profileIds)
      : Promise.resolve({ data: [] as { id: string; username: string; suspended_at: string | null }[] }),
  ]);

  const commentMap = new Map((comments ?? []).map((c) => [c.id, c]));
  const comparisonMap = new Map((comparisons ?? []).map((c) => [c.id, c]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows: AdminReportRow[] = list.map((r) => {
    const base = {
      id: r.id,
      reason: r.reason,
      details: r.details,
      createdAt: r.created_at,
      reporterUsername: r.profiles?.username ?? "unknown",
    };

    if (r.target_type === "comment") {
      const c = commentMap.get(r.target_id);
      return {
        ...base,
        targetType: "comment" as const,
        targetId: r.target_id,
        preview: c?.body ?? "(comment not found)",
        authorUsername: c?.profiles?.username ?? null,
        authorId: c?.user_id ?? null,
        alreadyRemoved: c?.status === "removed",
      };
    }

    if (r.target_type === "comparison") {
      const c = comparisonMap.get(r.target_id);
      const labels = [...(c?.comparison_options ?? [])]
        .sort((x, y) => x.side.localeCompare(y.side))
        .map((o) => o.label)
        .join(" vs ");
      return {
        ...base,
        targetType: "comparison" as const,
        targetId: r.target_id,
        preview: c ? `${labels}${c.prompt ? ` — ${c.prompt}` : ""}` : "(comparison not found)",
        authorUsername: null,
        authorId: c?.creator_id ?? null,
        alreadyRemoved: c?.status === "removed",
      };
    }

    const p = profileMap.get(r.target_id);
    return {
      ...base,
      targetType: "profile" as const,
      targetId: r.target_id,
      preview: p ? `@${p.username}` : "(profile not found)",
      authorUsername: p?.username ?? null,
      authorId: p?.id ?? null,
      alreadyRemoved: false,
      alreadySuspended: !!p?.suspended_at,
    };
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Moderation</h1>
      <p className="text-sm text-text-secondary">
        {rows.length} open {rows.length === 1 ? "report" : "reports"}.
      </p>
      <AdminReportList reports={rows} />
    </div>
  );
}
