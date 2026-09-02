import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { PLAY_SUBJECTS } from "@/lib/playFeed";

export const alt = "This or That - trivia rank";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface RankResult {
  rank_position: number;
  correct: number;
  total: number;
}

export default async function RankOgImage({
  params,
}: {
  params: Promise<{ username: string; subject: string }>;
}) {
  const { username, subject } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase.from("profiles").select("id").eq("username", username).single();

  let result: RankResult | null = null;
  if (profile) {
    const p_subject = subject === "all" ? null : subject;
    const { data: rows } = await supabase.rpc("get_user_rank", {
      p_user_id: profile.id,
      p_subject: p_subject ?? undefined,
    });
    result = (rows?.[0] as RankResult | undefined) ?? null;
  }

  const subjectMeta = PLAY_SUBJECTS.find((s) => s.slug === subject);
  const subjectLabel = subject === "all" ? "Overall" : subjectMeta?.label ?? subject;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(135deg, #0a0a0b 0%, #17171b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <span style={{ fontSize: 26, fontWeight: 700, color: "#98989d", letterSpacing: 1 }}>THIS OR THAT</span>
        <span style={{ fontSize: 44, fontWeight: 700, color: "#f5f5f7" }}>
          @{username} · {subjectLabel}
        </span>
        <span style={{ fontSize: 128, fontWeight: 800, color: "#0a84ff" }}>
          {result ? `#${result.rank_position}` : "-"}
        </span>
        <span style={{ fontSize: 30, color: "#98989d" }}>
          {result ? `${result.correct}/${result.total} correct` : "no rank yet"}
        </span>
      </div>
    ),
    { ...size }
  );
}
