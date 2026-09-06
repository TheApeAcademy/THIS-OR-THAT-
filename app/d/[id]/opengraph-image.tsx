import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "This or That - a live debate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgOption {
  side: string;
  label: string;
  vote_count: number;
}

interface OgRow {
  prompt: string | null;
  comparison_options: OgOption[];
}

// Generated fresh from the *current* vote split every time the link is
// unfurled, so the same preview naturally doubles as a "results card" once
// a debate has meaningful votes - not a separate system from the initial
// question-only share.
export default async function ComparisonOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("prompt, comparison_options!comparison_options_comparison_id_fkey(side, label, vote_count)")
    .eq("id", id)
    .single<OgRow>();

  const options = [...(comparison?.comparison_options ?? [])].sort((a, b) => a.side.localeCompare(b.side));
  const total = options.reduce((sum, o) => sum + o.vote_count, 0);
  const heading = comparison?.prompt || options.map((o) => o.label).join(" or ") || "This or That";

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ffffff", display: "flex" }} />
          <span style={{ fontSize: 26, fontWeight: 700, color: "#ffffffcc", letterSpacing: 2 }}>THIS OR THAT</span>
        </div>

        <span style={{ fontSize: 60, fontWeight: 800, color: "#ffffff", lineHeight: 1.15 }}>{heading}</span>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {options.slice(0, 4).map((o) => {
            const pct = total > 0 ? Math.round((o.vote_count / total) * 100) : 0;
            return (
              <div key={o.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: "#ffffff", width: 420 }}>{o.label}</span>
                <div style={{ display: "flex", flex: 1, height: 20, borderRadius: 999, background: "#ffffff1a", overflow: "hidden" }}>
                  <div style={{ display: "flex", width: `${Math.max(pct, total > 0 ? 3 : 0)}%`, height: "100%", background: "#38bdf8", borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#7dd3fc", width: 90, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
          <span style={{ fontSize: 26, color: "#ffffff99", marginTop: 8 }}>
            {total > 0 ? `${total.toLocaleString()} votes so far` : "Be the first to vote"}
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
