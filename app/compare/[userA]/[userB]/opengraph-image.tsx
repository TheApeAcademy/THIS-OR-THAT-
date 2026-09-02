import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const alt = "This or That - compatibility";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface CompareResult {
  compatibility_pct: number | null;
  shared_comparisons: number;
}

export default async function CompareOgImage({
  params,
}: {
  params: Promise<{ userA: string; userB: string }>;
}) {
  const { userA, userB } = await params;
  const supabase = await createClient();

  const [{ data: profileA }, { data: profileB }] = await Promise.all([
    supabase.from("profiles").select("id, username").eq("username", userA).single(),
    supabase.from("profiles").select("id, username").eq("username", userB).single(),
  ]);

  let pct: number | null = null;
  let shared = 0;
  if (profileA && profileB) {
    const { data: result } = await supabase.rpc("compare_users", {
      user_a: profileA.id,
      user_b: profileB.id,
    });
    const compare = result as unknown as CompareResult | null;
    pct = compare?.compatibility_pct ?? null;
    shared = compare?.shared_comparisons ?? 0;
  }

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
        <span style={{ fontSize: 26, fontWeight: 700, color: "#98989d", letterSpacing: 1 }}>
          THIS OR THAT
        </span>
        <span style={{ fontSize: 44, fontWeight: 700, color: "#f5f5f7" }}>
          @{userA} × @{userB}
        </span>
        <span style={{ fontSize: 128, fontWeight: 800, color: "#0a84ff" }}>
          {pct !== null ? `${pct}%` : "-"}
        </span>
        <span style={{ fontSize: 30, color: "#98989d" }}>
          {pct !== null ? `compatible across ${shared} shared choices` : "no shared choices yet"}
        </span>
      </div>
    ),
    { ...size }
  );
}
