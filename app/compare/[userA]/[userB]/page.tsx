import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";

export const dynamic = "force-dynamic";

interface CategoryCompatibility {
  category_slug: string;
  category_label: string;
  category_emoji: string | null;
  shared: number;
  agreed: number;
  pct: number;
}

interface CompareResult {
  shared_comparisons: number;
  agreed: number;
  compatibility_pct: number | null;
  agreements: { comparison_id: string; option_label: string }[];
  differences: { comparison_id: string; user_a_label: string; user_b_label: string }[];
  by_category: CategoryCompatibility[];
}

const getCompareData = cache(async (userA: string, userB: string) => {
  const supabase = await createClient();

  const [{ data: profileA }, { data: profileB }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url, compatibility_visibility")
      .eq("username", userA)
      .single(),
    supabase
      .from("profiles")
      .select("id, username, avatar_url, compatibility_visibility")
      .eq("username", userB)
      .single(),
  ]);

  if (!profileA || !profileB) return null;

  const { data: result } = await supabase.rpc("compare_users", {
    user_a: profileA.id,
    user_b: profileB.id,
  });

  return { profileA, profileB, compare: (result as unknown as CompareResult) ?? null };
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
  const title =
    pct !== null && pct !== undefined
      ? `@${userA} × @${userB} are ${pct}% compatible · This or That`
      : `@${userA} × @${userB} · This or That`;
  const description =
    pct !== null && pct !== undefined
      ? `See where @${userA} and @${userB} agree and disagree on This or That.`
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

  const { profileA, profileB, compare } = data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const canViewSide = async (profile: { id: string; compatibility_visibility: string }) => {
    if (user?.id === profile.id) return true;
    if (profile.compatibility_visibility === "public") return true;
    if (profile.compatibility_visibility === "followers") {
      if (!user) return false;
      const { data: followRow } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("followee_id", profile.id)
        .maybeSingle();
      return !!followRow;
    }
    return false;
  };

  const visible = (await Promise.all([canViewSide(profileA), canViewSide(profileB)])).every(Boolean);

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

      {!visible ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          One of these people limits who can see their compatibility results.
        </p>
      ) : !compare ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          Couldn&rsquo;t load this comparison right now. Try again in a moment.
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-surface-raised p-6 text-center shadow-sm">
            <p className="text-4xl font-bold text-accent">
              {compare.compatibility_pct !== null ? `${compare.compatibility_pct}%` : "—"}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {compare.compatibility_pct !== null
                ? `compatible across ${compare.shared_comparisons} shared comparisons`
                : "No comparisons in common yet — go vote on a few of the same ones!"}
            </p>
          </div>

          {compare.by_category.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-text-secondary">By category</p>
              <div className="space-y-2">
                {compare.by_category.map((c) => (
                  <div key={c.category_slug} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">
                      {c.category_emoji} {c.category_label}
                    </span>
                    <span className="text-text-secondary">
                      {c.pct}% <span className="opacity-70">· {c.shared} shared</span>
                    </span>
                  </div>
                ))}
              </div>
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
