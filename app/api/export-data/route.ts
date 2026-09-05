import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Assembles the user's own data server-side and returns it as a download -
// no new table, just a read + JSON serialize. Matches the "aggregated
// preference intelligence" framing from the data-consent work: this is the
// raw personal-data export a user is always entitled to regardless of
// their consent tier.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [{ data: profile }, { data: votes }, { data: comments }, { data: comparisons }, { data: preferenceDna }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("votes").select("comparison_id, option_id, created_at").eq("user_id", user.id),
      supabase
        .from("comments")
        .select("id, comparison_id, body, created_at")
        .eq("user_id", user.id),
      supabase
        .from("comparisons")
        .select("id, prompt, created_at, status")
        .eq("creator_id", user.id),
      supabase.from("preference_dna").select("breakdown, updated_at").eq("user_id", user.id).maybeSingle(),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile,
    votes,
    comments,
    comparisons,
    preference_dna: preferenceDna,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="this-or-that-export-${user.id}.json"`,
    },
  });
}
