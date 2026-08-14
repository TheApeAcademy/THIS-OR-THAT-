import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShareCard } from "@/components/ShareCard";
import type { DnaRow } from "@/components/DnaBreakdown";

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
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

export default async function PublicCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("cards")
    .select("user_id, ai_summary, snapshot, profiles(username, display_name, avatar_url)")
    .eq("share_slug", slug)
    .single<CardRow>();

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

  return (
    <ShareCard
      username={username}
      avatarUrl={card.profiles?.avatar_url ?? null}
      aiSummary={card.ai_summary}
      rows={rows}
      shareSlug={slug}
    />
  );
}
