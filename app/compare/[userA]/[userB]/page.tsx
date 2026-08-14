import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";

export const dynamic = "force-dynamic";

interface CompareResult {
  shared_comparisons: number;
  agreed: number;
  compatibility_pct: number | null;
  agreements: { comparison_id: string; option_label: string }[];
  differences: { comparison_id: string; user_a_label: string; user_b_label: string }[];
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ userA: string; userB: string }>;
}) {
  const { userA, userB } = await params;
  const supabase = await createClient();

  const [{ data: profileA }, { data: profileB }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").eq("username", userA).single(),
    supabase.from("profiles").select("id, username, avatar_url").eq("username", userB).single(),
  ]);

  if (!profileA || !profileB) notFound();

  const { data: result, error } = await supabase.rpc("compare_users", {
    user_a: profileA.id,
    user_b: profileB.id,
  });

  if (error) throw error;
  const compare = result as unknown as CompareResult;

  return (
    <div
      className="mx-auto max-w-md space-y-6 px-4 py-8"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar name={profileA.username} src={profileA.avatar_url} size={56} />
          <p className="text-sm font-medium text-text-primary">@{profileA.username}</p>
        </div>
        <p className="text-2xl font-bold text-text-secondary">×</p>
        <div className="flex flex-col items-center gap-2">
          <Avatar name={profileB.username} src={profileB.avatar_url} size={56} />
          <p className="text-sm font-medium text-text-primary">@{profileB.username}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-6 text-center shadow-sm">
        <p className="text-4xl font-bold text-accent">
          {compare.compatibility_pct !== null ? `${compare.compatibility_pct}%` : "—"}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          {compare.compatibility_pct !== null
            ? `compatible across ${compare.shared_comparisons} shared comparisons`
            : "No comparisons in common yet"}
        </p>
      </div>

      {compare.agreements.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-text-secondary">You both prefer</p>
          <div className="flex flex-wrap gap-2">
            {compare.agreements.map((a) => (
              <span key={a.comparison_id} className="rounded-full bg-surface px-3 py-1 text-sm text-text-primary">
                {a.option_label}
              </span>
            ))}
          </div>
        </div>
      )}

      {compare.differences.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-text-secondary">You disagree on</p>
          <div className="space-y-2">
            {compare.differences.map((d) => (
              <div
                key={d.comparison_id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="text-text-primary">{d.user_a_label}</span>
                <span className="text-text-secondary">vs</span>
                <span className="text-text-primary">{d.user_b_label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
