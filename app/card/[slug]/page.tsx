import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShareCard } from "@/components/ShareCard";
import type { CardCommentNode, FlatCardComment } from "@/lib/commentTree";
import { buildCardCommentTree } from "@/lib/commentTree";
import type { DnaRow } from "@/components/DnaBreakdown";
import type { SocialLinks } from "@/lib/actions/profile";
import { generateQrDataUrl } from "@/lib/qr";
import { getArchetype } from "@/lib/archetype";
import { daysAgoIso } from "@/lib/relativeTime";

export const dynamic = "force-dynamic";

interface CardSnapshot {
  username?: string;
  displayName?: string | null;
  breakdown?: Record<string, { votes: number; pct: number }>;
}

interface CardRow {
  id: string;
  user_id: string;
  ai_summary: string | null;
  snapshot: CardSnapshot | null;
  like_count: number;
  comment_count: number;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    avatar_model_url: string | null;
    avatar_fullbody_url: string | null;
    profile_photo_url: string | null;
    bio: string | null;
    ai_bio: string | null;
    social_links: SocialLinks | null;
    current_streak: number;
    show_play_score: boolean;
    show_streak: boolean;
    show_dna: boolean;
  } | null;
}

const getCard = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: card } = await supabase
    .from("cards")
    .select(
      "id, user_id, ai_summary, snapshot, like_count, comment_count, profiles!cards_user_id_fkey(username, display_name, avatar_url, avatar_model_url, avatar_fullbody_url, profile_photo_url, bio, ai_bio, social_links, current_streak, show_play_score, show_streak, show_dna)"
    )
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
  const archetype = getArchetype(topCategory?.[0] ?? null, username);
  const description =
    card.ai_summary ??
    (topCategory
      ? `@${username}'s top preference is ${topCategory[0]} at ${topCategory[1].pct}%. See their full Preference DNA.`
      : `See @${username}'s Preference DNA on This or That — every choice tells a story.`);

  const title = archetype
    ? `@${username} is ${archetype} · This or That`
    : `@${username}'s Preference DNA · This or That`;

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

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const shareUrl = host ? `${protocol}://${host}/card/${slug}` : null;

  const [{
    data: { user },
  }, card, qrDataUrl] = await Promise.all([
    supabase.auth.getUser(),
    getCard(slug),
    shareUrl ? generateQrDataUrl(shareUrl) : Promise.resolve(null),
  ]);
  if (!card) notFound();

  const { data: viewer } = user
    ? await supabase
        .from("profiles")
        .select("username, avatar_url, profile_photo_url")
        .eq("id", user.id)
        .single()
    : { data: null };

  const historyThreshold = daysAgoIso(20);

  const [
    { data: categories },
    { data: likedRow },
    { data: commentRows },
    { data: playStats },
    { data: followRow },
    { data: percentiles },
    { data: historyRow },
    { data: rankRows },
  ] = await Promise.all([
    supabase.from("categories").select("slug, label, emoji"),
    user
      ? supabase
          .from("card_likes")
          .select("card_id")
          .eq("card_id", card.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("card_comments")
      .select("id, body, parent_comment_id, created_at, profiles(username, avatar_url, profile_photo_url)")
      .eq("card_id", card.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200)
      .returns<FlatCardComment[]>(),
    supabase.from("play_stats").select("correct, total").eq("user_id", card.user_id),
    user && user.id !== card.user_id
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("followee_id", card.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.rpc("get_dna_percentiles", { p_user_id: card.user_id }),
    supabase
      .from("preference_dna_history")
      .select("breakdown, captured_at")
      .eq("user_id", card.user_id)
      .lt("captured_at", historyThreshold)
      .order("captured_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.rpc("get_user_rank", { p_user_id: card.user_id }),
  ]);
  const playScore = (playStats ?? []).reduce(
    (acc, s) => ({ correct: acc.correct + s.correct, total: acc.total + s.total }),
    { correct: 0, total: 0 }
  );
  const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));
  const comments: CardCommentNode[] = buildCardCommentTree(commentRows ?? []);

  const percentileMap = new Map((percentiles ?? []).map((p) => [p.slug, p]));
  const historyBreakdown = (historyRow?.breakdown ?? null) as Record<string, { pct: number }> | null;
  const triviaRank = rankRows?.[0]?.rank_position ? Number(rankRows[0].rank_position) : null;

  const breakdown = card.snapshot?.breakdown ?? {};
  const rows: DnaRow[] = Object.entries(breakdown)
    .map(([catSlug, v]) => {
      const p = percentileMap.get(catSlug);
      const priorPct = historyBreakdown?.[catSlug]?.pct;
      return {
        slug: catSlug,
        label: categoryMeta.get(catSlug)?.label ?? catSlug,
        emoji: categoryMeta.get(catSlug)?.emoji ?? null,
        pct: v.pct,
        votes: v.votes,
        percentile: p ? Number(p.percentile) : undefined,
        sampleSize: p ? Number(p.sample_size) : undefined,
        deltaPct: priorPct !== undefined ? Math.round(v.pct - priorPct) : undefined,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const username = card.profiles?.username ?? card.snapshot?.username ?? "unknown";
  const totalVotes = Object.values(breakdown).reduce((sum, v) => sum + v.votes, 0);

  return (
    <ShareCard
      username={username}
      displayName={card.profiles?.display_name ?? null}
      avatarUrl={card.profiles?.avatar_url ?? null}
      avatarFullbodyUrl={card.profiles?.avatar_fullbody_url ?? null}
      avatarModelUrl={card.profiles?.avatar_model_url ?? null}
      profilePhotoUrl={card.profiles?.profile_photo_url ?? null}
      bio={card.profiles?.bio ?? null}
      aiBio={card.profiles?.ai_bio ?? null}
      aiSummary={card.ai_summary}
      rows={rows}
      totalVotes={totalVotes}
      socialLinks={card.profiles?.social_links ?? {}}
      shareSlug={slug}
      cardId={card.id}
      likeCount={card.like_count}
      likedByMe={!!likedRow}
      commentCount={card.comment_count}
      comments={comments}
      isAuthed={!!user}
      viewerAvatarUrl={viewer?.profile_photo_url ?? viewer?.avatar_url ?? null}
      viewerUsername={viewer?.username && viewer.username !== username ? viewer.username : null}
      streak={card.profiles?.show_streak === false ? 0 : card.profiles?.current_streak ?? 0}
      showPlayScore={card.profiles?.show_play_score ?? true}
      showDna={card.profiles?.show_dna ?? true}
      playScore={playScore}
      triviaRank={triviaRank}
      qrDataUrl={qrDataUrl}
      viewerId={user?.id ?? null}
      profileUserId={card.user_id}
      followedByMe={!!followRow}
    />
  );
}
