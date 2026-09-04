import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

interface CardRow {
  share_slug: string;
  profiles: { card_visibility: string } | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://thisorthat.app";
  const supabase = await createClient();

  const [{ data: cards }, { data: topics }] = await Promise.all([
    supabase
      .from("cards")
      .select("share_slug, profiles!cards_user_id_fkey!inner(card_visibility)")
      .eq("profiles.card_visibility", "public")
      .limit(5000)
      .returns<CardRow[]>(),
    supabase.from("topics").select("slug").limit(1000),
  ]);

  const cardEntries: MetadataRoute.Sitemap = (cards ?? []).map((c) => ({
    url: `${base}/card/${c.share_slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const topicEntries: MetadataRoute.Sitemap = (topics ?? []).map((t) => ({
    url: `${base}/topic/${t.slug}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  return [...cardEntries, ...topicEntries];
}
