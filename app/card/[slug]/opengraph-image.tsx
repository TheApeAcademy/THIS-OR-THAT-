import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "This or That — Preference DNA card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface CardSnapshot {
  username?: string;
  breakdown?: Record<string, { votes: number; pct: number }>;
}

interface CardRow {
  snapshot: CardSnapshot | null;
  profiles: { username: string } | null;
}

export default async function CardOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("cards")
    .select("snapshot, profiles(username)")
    .eq("share_slug", slug)
    .single<CardRow>();

  const { data: categories } = await supabase.from("categories").select("slug, label, emoji");
  const categoryMeta = new Map((categories ?? []).map((c) => [c.slug, c]));

  const username = card?.profiles?.username ?? card?.snapshot?.username ?? "someone";
  const breakdown = card?.snapshot?.breakdown ?? {};
  const top = Object.entries(breakdown)
    .sort((a, b) => b[1].pct - a[1].pct)
    .slice(0, 3)
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
          background: "linear-gradient(135deg, #0a0a0b 0%, #17171b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#0a84ff",
              display: "flex",
            }}
          />
          <span style={{ fontSize: 28, fontWeight: 700, color: "#98989d", letterSpacing: 1 }}>
            THIS OR THAT
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 76, fontWeight: 800, color: "#f5f5f7" }}>@{username}</span>
          <span style={{ fontSize: 32, color: "#98989d" }}>My Preference DNA</span>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            {top.length === 0 ? (
              <span style={{ fontSize: 28, color: "#6e6e73" }}>Building their taste profile…</span>
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
                    background: "#1c1c1e",
                    border: "2px solid #3a3a3c",
                  }}
                >
                  <span style={{ fontSize: 30 }}>{t.emoji}</span>
                  <span style={{ fontSize: 28, color: "#f5f5f7", fontWeight: 600 }}>
                    {t.label} {t.pct}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <span style={{ fontSize: 26, color: "#6e6e73" }}>Every choice tells a story.</span>
      </div>
    ),
    { ...size }
  );
}
