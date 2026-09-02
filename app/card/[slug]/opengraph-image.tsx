import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getArchetype } from "@/lib/archetype";

export const alt = "This or That - Preference DNA card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface CardSnapshot {
  username?: string;
  breakdown?: Record<string, { votes: number; pct: number }>;
}

interface CardRow {
  snapshot: CardSnapshot | null;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    profile_photo_url: string | null;
  } | null;
}

export default async function CardOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("cards")
    .select("snapshot, profiles!cards_user_id_fkey(username, display_name, avatar_url, profile_photo_url)")
    .eq("share_slug", slug)
    .single<CardRow>();

  const { data: categories } = await supabase.from("categories").select("slug, label, emoji");
  const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));

  const username = card?.profiles?.username ?? card?.snapshot?.username ?? "someone";
  const displayName = card?.profiles?.display_name ?? username;
  const avatarUrl = card?.profiles?.profile_photo_url ?? card?.profiles?.avatar_url ?? null;
  const breakdown = card?.snapshot?.breakdown ?? {};
  const topCategorySlug = Object.entries(breakdown).sort((a, b) => b[1].pct - a[1].pct)[0]?.[0] ?? null;
  const archetype = getArchetype(topCategorySlug, username);
  const top = Object.entries(breakdown)
    .sort((a, b) => b[1].pct - a[1].pct)
    .slice(0, 4)
    .map(([slug, v]) => ({
      label: categoryMeta.get(slug)?.label ?? slug,
      emoji: categoryMeta.get(slug)?.emoji ?? "",
      pct: v.pct,
    }));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(155deg, #050914 0%, #0a1a3d 45%, #0066ff 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ffffff", display: "flex" }} />
            <span style={{ fontSize: 26, fontWeight: 700, color: "#ffffffcc", letterSpacing: 2 }}>
              THIS OR THAT
            </span>
          </div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              width={96}
              height={96}
              style={{ borderRadius: 999, border: "3px solid #ffffff66" }}
            />
          ) : (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                background: "linear-gradient(150deg, #0066ff, #38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                fontWeight: 800,
                color: "#ffffffcc",
                border: "3px solid #ffffff66",
              }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 68, fontWeight: 800, color: "#ffffff" }}>{displayName}</span>
          <span style={{ fontSize: 30, color: "#ffffff99" }}>@{username}</span>
          {archetype && (
            <span style={{ fontSize: 32, fontWeight: 800, color: "#7dd3fc" }}>✦ {archetype}</span>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
            {top.length === 0 ? (
              <span style={{ fontSize: 28, color: "#ffffff99" }}>Building their taste profile…</span>
            ) : (
              top.map((t) => (
                <div
                  key={t.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 24px",
                    borderRadius: 999,
                    background: "#ffffff1a",
                    border: "2px solid #ffffff33",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{t.emoji}</span>
                  <span style={{ fontSize: 26, color: "#ffffff", fontWeight: 700 }}>
                    {t.label} {t.pct}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <span style={{ fontSize: 26, color: "#ffffff99" }}>Every choice tells a story.</span>
      </div>
    ),
    { ...size }
  );
}
