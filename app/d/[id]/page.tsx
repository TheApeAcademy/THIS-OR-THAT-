import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PublicComparisonView } from "@/components/PublicComparisonView";
import { logLinkVisitAction } from "@/lib/actions/linkVisits";

export const dynamic = "force-dynamic";

interface PublicComparisonRow {
  id: string;
  prompt: string | null;
  view_count: number;
  comment_count: number;
  comments_locked: boolean;
  created_at: string;
  creator_id: string | null;
  comparison_hashtags: { hashtags: { tag: string } | null }[];
  comparison_options: { id: string; side: string; label: string; image_url: string | null; vote_count: number }[];
  profiles: { username: string; avatar_url: string | null; profile_photo_url: string | null; verification_type: string } | null;
}

const getComparison = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comparisons")
    .select(
      "id, prompt, view_count, comment_count, comments_locked, created_at, creator_id, comparison_hashtags(hashtags(tag)), comparison_options!comparison_options_comparison_id_fkey(id, side, label, image_url, vote_count), profiles!comparisons_creator_id_fkey(username, avatar_url, profile_photo_url, verification_type)"
    )
    .eq("id", id)
    .eq("status", "active")
    .single<PublicComparisonRow>();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const comparison = await getComparison(id);
  if (!comparison) return { title: "Debate not found · This or That" };

  const options = [...comparison.comparison_options].sort((a, b) => a.side.localeCompare(b.side));
  const heading = comparison.prompt || options.map((o) => o.label).join(" or ");
  const total = options.reduce((sum, o) => sum + o.vote_count, 0);
  const description =
    total > 0
      ? `${formatVotes(total)} votes so far - see who's winning and add yours on This or That.`
      : "Vote and see live results on This or That.";

  return {
    title: `${heading} · This or That`,
    description,
    openGraph: {
      title: heading,
      description,
      type: "website",
      url: `/d/${id}`,
      images: [`/d/${id}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title: heading,
      description,
      images: [`/d/${id}/opengraph-image`],
    },
  };
}

function formatVotes(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default async function PublicComparisonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ source?: string }>;
}) {
  const { id } = await params;
  const { source } = await searchParams;
  const supabase = await createClient();

  const [{ data: { user } }, comparison, hdrs] = await Promise.all([
    supabase.auth.getUser(),
    getComparison(id),
    headers(),
  ]);
  if (!comparison) notFound();

  // A visitor who's already signed in gets the real, interactive page
  // instead of the read-only public shell - this route exists for
  // signed-out visitors, not as a second copy of the detail page.
  if (user) redirect(`/comparison/${id}`);

  if (source) logLinkVisitAction(id, source).catch(() => {});

  const { data: commentRows } = await supabase
    .from("comments")
    .select("id, body, like_count, profiles(username, avatar_url, profile_photo_url)")
    .eq("comparison_id", id)
    .eq("status", "active")
    .order("like_count", { ascending: false })
    .limit(3)
    .returns<{ id: string; body: string; profiles: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null }[]>();

  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const shareUrl = host ? `${protocol}://${host}/d/${id}` : `/d/${id}`;

  const options = [...comparison.comparison_options]
    .sort((a, b) => a.side.localeCompare(b.side))
    .map((o) => ({ id: o.id, label: o.label, imageUrl: o.image_url, voteCount: o.vote_count }));

  return (
    <PublicComparisonView
      comparisonId={id}
      prompt={comparison.prompt}
      options={options}
      hashtags={(comparison.comparison_hashtags ?? []).map((ch) => ch.hashtags?.tag).filter((t): t is string => !!t)}
      viewCount={comparison.view_count ?? 0}
      createdAt={comparison.created_at}
      creator={
        comparison.profiles
          ? {
              username: comparison.profiles.username,
              avatarUrl: comparison.profiles.profile_photo_url ?? comparison.profiles.avatar_url,
              verified: comparison.profiles.verification_type !== "none",
            }
          : null
      }
      commentsLocked={comparison.comments_locked ?? false}
      commentCount={comparison.comment_count ?? 0}
      topComments={(commentRows ?? []).map((c) => ({
        id: c.id,
        body: c.body,
        author: { username: c.profiles?.username ?? "someone", avatarUrl: c.profiles?.profile_photo_url ?? c.profiles?.avatar_url ?? null },
      }))}
      shareUrl={shareUrl}
    />
  );
}
