import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ShareCard } from "@/components/ShareCard";
import type { CardCommentData } from "@/components/CardEngagement";
import type { DnaRow } from "@/components/DnaBreakdown";
import type { SocialLinks } from "@/lib/actions/profile";
import { generateQrDataUrl } from "@/lib/qr";

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
  view_count: number;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    ai_bio: string | null;
    social_links: SocialLinks | null;
    current_streak: number;
    show_play_score: boolean;
    show_streak: boolean;
    show_dna: boolean;
    card_visibility: string;
    preference_visibility: string;
    social_links_visibility: string;
  } | null;
}

const getCard = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: card } = await supabase
    .from("cards")
    .select(
      "id, user_id, ai_summary, snapshot, like_count, comment_count, view_count, profiles!cards_user_id_fkey(username, display_name, avatar_url, bio, ai_bio, social_links, current_streak, show_play_score, show_streak, show_dna, card_visibility, preference_visibility, social_links_visibility)"
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
    ? await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).single()
    : { data: null };

  const card = await getCard(slug);
  if (!card) notFound();

  const isOwner = user?.id === card.user_id;

  const isFollowerOf = async (targetUserId: string) => {
    if (!user || user.id === targetUserId) return false;
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("followee_id", targetUserId)
      .maybeSingle();
    return !!data;
  };

  const canView = (visibility: string, isFollower: boolean) =>
    isOwner || visibility === "public" || (visibility === "followers" && isFollower);

  const cardVisibility = card.profiles?.card_visibility ?? "public";
  const needsFollowCheck = !isOwner && (cardVisibility === "followers");
  const isFollower = needsFollowCheck ? await isFollowerOf(card.user_id) : false;

  if (!canView(cardVisibility, isFollower)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-8 py-24 text-center">
        <p className="text-xl font-semibold text-text-primary">This card is private</p>
        <p className="text-sm text-text-secondary">
          @{card.profiles?.username ?? "This user"} limits who can see their card.
        </p>
      </div>
    );
  }

  if (!isOwner) {
    // An aggregate counter only — no visitor identity is stored.
    await supabase.rpc("increment_card_view", { p_card_id: card.id });
  }

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const shareUrl = host ? `${protocol}://${host}/card/${slug}` : null;
  const qrDataUrl = shareUrl ? await generateQrDataUrl(shareUrl) : null;

  const [{ data: categories }, { data: likedRow }, { data: commentRows }, { data: playStats }, { data: followRow }] =
    await Promise.all([
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
        .select("id, body, profiles(username, avatar_url)")
        .eq("card_id", card.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(30)
        .returns<{ id: string; body: string; profiles: { username: string; avatar_url: string | null } | null }[]>(),
      supabase.from("play_stats").select("correct, total").eq("user_id", card.user_id),
      user && user.id !== card.user_id
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", user.id)
            .eq("followee_id", card.user_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const playScore = (playStats ?? []).reduce(
    (acc, s) => ({ correct: acc.correct + s.correct, total: acc.total + s.total }),
    { correct: 0, total: 0 }
  );
  const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));
  const comments: CardCommentData[] = (commentRows ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    author: { username: c.profiles?.username ?? "unknown", avatarUrl: c.profiles?.avatar_url ?? null },
  }));

  const isFollowerFinal = isFollower || !!followRow;
  const dnaVisible = canView(card.profiles?.preference_visibility ?? "public", isFollowerFinal);
  const socialLinksVisible = canView(card.profiles?.social_links_visibility ?? "public", isFollowerFinal);

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: card.profiles?.display_name || username,
      alternateName: username,
      description: card.ai_summary ?? card.profiles?.bio ?? undefined,
      image: card.profiles?.avatar_url ?? undefined,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ShareCard
        username={username}
        displayName={card.profiles?.display_name ?? null}
        avatarUrl={card.profiles?.avatar_url ?? null}
        bio={card.profiles?.bio ?? null}
        aiBio={card.profiles?.ai_bio ?? null}
        aiSummary={card.ai_summary}
        rows={rows}
        totalVotes={totalVotes}
        socialLinks={socialLinksVisible ? card.profiles?.social_links ?? {} : {}}
        shareSlug={slug}
        cardId={card.id}
        likeCount={card.like_count}
        likedByMe={!!likedRow}
        commentCount={card.comment_count}
        comments={comments}
        isAuthed={!!user}
        viewerAvatarUrl={viewer?.avatar_url ?? null}
        viewerUsername={viewer?.username && viewer.username !== username ? viewer.username : null}
        streak={card.profiles?.show_streak === false ? 0 : card.profiles?.current_streak ?? 0}
        showPlayScore={card.profiles?.show_play_score ?? true}
        showDna={dnaVisible && (card.profiles?.show_dna ?? true)}
        playScore={playScore}
        qrDataUrl={qrDataUrl}
        viewerId={user?.id ?? null}
        profileUserId={card.user_id}
        followedByMe={!!followRow}
        viewCount={card.view_count}
      />
    </>
  );
}
