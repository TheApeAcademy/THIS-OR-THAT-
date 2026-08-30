import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShareCard } from "@/components/ShareCard";
import type { DnaRow } from "@/components/DnaBreakdown";
import type { SocialLinks } from "@/lib/actions/profile";

export const dynamic = "force-dynamic";

interface CardSnapshot {
  username?: string;
  displayName?: string | null;
  breakdown?: Record<string, { votes: number; pct: number }>;
}

interface CardRow {
  user_id: string;
  ai_summary: string | null;
  snapshot: CardSnapshot | null;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    social_links: SocialLinks | null;
  } | null;
}

const getCard = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: card } = await supabase
    .from("cards")
    .select("user_id, ai_summary, snapshot, profiles(username, display_name, avatar_url, bio, social_links)")
    .eq("share_slug", slug)
    .single<CardRow>();
  return card;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = await getCard(slug);
  if (!card) return { title: "Card not found · This or That" };

  const username = card.profiles?.username ?? card.snapshot?.username ?? "unknown";
  const breakdown = card.snapshot?.breakdown ?? {};
  const topCategory = Object.entries(breakdown).sort((a, b) => b[1].pct - a[1].pct)[0];
  const description =
    card.ai_summary ??
    (topCategory
      ? `@${username}'s top preference is ${topCategory[0]} at ${topCategory[1].pct}%. See their full Preference DNA.`
      : `See @${username}'s Preference DNA on This or That — every choice tells a story.`);

  const title = `@${username}'s Preference DNA · This or That`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/card/${slug}`,
      images: [`/card/${slug}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/card/${slug}/opengraph-image`],
    },
  };
}

export default async function PublicCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewer } = user
    ? await supabase.from("profiles").select("username").eq("id", user.id).single()
    : { data: null };

  const card = await getCard(slug);
  if (!card) notFound();

  const { data: categories } = await supabase.from("categories").select("slug, label, emoji");
  const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));

  const breakdown = card.snapshot?.breakdown ?? {};
  const rows: DnaRow[] = Object.entries(breakdown)
    .map(([catSlug, v]) => ({
      slug: catSlug,
      label: categoryMeta.get(catSlug)?.label ?? catSlug,
      emoji: categoryMeta.get(catSlug)?.emoji ?? null,
      pct: v.pct,
      votes: v.votes,
    }))
    .sort((a, b) => b.pct - a.pct);

  const username = card.profiles?.username ?? card.snapshot?.username ?? "unknown";
  const totalVotes = Object.values(breakdown).reduce((sum, v) => sum + v.votes, 0);

  return (
    <ShareCard
      username={username}
      displayName={card.profiles?.display_name ?? null}
      avatarUrl={card.profiles?.avatar_url ?? null}
      bio={card.profiles?.bio ?? null}
      aiSummary={card.ai_summary}
      rows={rows}
      totalVotes={totalVotes}
      socialLinks={card.profiles?.social_links ?? {}}
      shareSlug={slug}
      viewerUsername={viewer?.username && viewer.username !== username ? viewer.username : null}
    />
  );
}
