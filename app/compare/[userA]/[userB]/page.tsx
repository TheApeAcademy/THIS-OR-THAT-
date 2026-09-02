import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { DnaCompareRows } from "@/components/DnaCompareRows";

export const dynamic = "force-dynamic";

interface CompareResult {
  shared_comparisons: number;
  agreed: number;
  compatibility_pct: number | null;
  agreements: { comparison_id: string; option_label: string }[];
  differences: { comparison_id: string; user_a_label: string; user_b_label: string }[];
}

interface DnaCompareResult {
  dna_similarity_pct: number | null;
  top_shared_categories: { slug: string; label: string; emoji: string | null; pct_a: number; pct_b: number }[];
}

const getCompareData = cache(async (userA: string, userB: string) => {
  const supabase = await createClient();

  const [{ data: profileA }, { data: profileB }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url, profile_photo_url").eq("username", userA).single(),
    supabase.from("profiles").select("id, username, avatar_url, profile_photo_url").eq("username", userB).single(),
  ]);

  if (!profileA || !profileB) return null;

  const [{ data: result }, { data: dnaResult }] = await Promise.all([
    supabase.rpc("compare_users", { user_a: profileA.id, user_b: profileB.id }),
    supabase.rpc("compare_dna", { user_a: profileA.id, user_b: profileB.id }),
  ]);

  return {
    profileA,
    profileB,
    compare: (result as unknown as CompareResult) ?? null,
    dna: (dnaResult as unknown as DnaCompareResult) ?? null,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userA: string; userB: string }>;
}): Promise<Metadata> {
  const { userA, userB } = await params;
  const data = await getCompareData(userA, userB);
  if (!data) return { title: "Compare · This or That" };

  const pct = data.compare?.compatibility_pct;
  const dnaPct = data.dna?.dna_similarity_pct;
  const title =
    pct !== null && pct !== undefined
      ? `@${userA} × @${userB} are ${pct}% compatible · This or That`
      : `@${userA} × @${userB} · This or That`;
  const description =
    pct !== null && pct !== undefined
      ? `See where @${userA} and @${userB} agree and disagree on This or That.${
          dnaPct !== null && dnaPct !== undefined ? ` Interest overlap: ${dnaPct}%.` : ""
        }`
      : `Compare preferences between @${userA} and @${userB} on This or That.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/compare/${userA}/${userB}`,
      images: [`/compare/${userA}/${userB}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/compare/${userA}/${userB}/opengraph-image`],
    },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ userA: string; userB: string }>;
}) {
  const { userA, userB } = await params;
  const data = await getCompareData(userA, userB);
  if (!data) notFound();

  const { profileA, profileB, compare, dna } = data;

  return (
    <div
      className="mx-auto max-w-md space-y-6 px-4 py-8"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar name={profileA.username} src={profileA.profile_photo_url ?? profileA.avatar_url} size={56} />
          <p className="text-sm font-medium text-text-primary">@{profileA.username}</p>
        </div>
        <p className="text-2xl font-bold text-text-secondary">×</p>
        <div className="flex flex-col items-center gap-2">
          <Avatar name={profileB.username} src={profileB.profile_photo_url ?? profileB.avatar_url} size={56} />
          <p className="text-sm font-medium text-text-primary">@{profileB.username}</p>
        </div>
      </div>

      {!compare ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          Couldn&rsquo;t load this comparison right now. Try again in a moment.
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface-raised p-6 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Vote agreement</p>
            <p className="text-4xl font-bold text-accent">
              {compare.compatibility_pct !== null ? `${compare.compatibility_pct}%` : "-"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {compare.compatibility_pct !== null
                ? `compatible across ${compare.shared_comparisons} shared comparisons`
                : "No comparisons in common yet - go vote on a few of the same ones!"}
            </p>
          </div>

          {dna && (
            <div className="rounded-xl border border-border bg-surface-raised p-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Interest overlap</p>
              <p className="text-4xl font-bold text-accent-2">
                {dna.dna_similarity_pct !== null ? `${dna.dna_similarity_pct}%` : "-"}
              </p>
              <p className="mt-1 text-sm text-text-secondary">based on what you each vote on most</p>
            </div>
          )}

          {dna && dna.top_shared_categories.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-text-secondary">Where your interests overlap</p>
              <DnaCompareRows rows={dna.top_shared_categories} labelA={userA} labelB={userB} />
            </div>
          )}

          {compare.agreements.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-text-secondary">You both prefer</p>
              <div className="flex flex-wrap gap-2">
                {compare.agreements.map((a) => (
                  <span
                    key={a.comparison_id}
                    className="rounded-full bg-surface px-3 py-1 text-sm text-text-primary"
                  >
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
        </>
      )}
    </div>
  );
}
