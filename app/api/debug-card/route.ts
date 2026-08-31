import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const supabase = await createClient();

  const result = await supabase
    .from("cards")
    .select(
      "id, user_id, ai_summary, snapshot, like_count, comment_count, profiles(username, display_name, avatar_url, bio, ai_bio, social_links, current_streak, show_play_score)"
    )
    .eq("share_slug", slug)
    .single();

  return NextResponse.json({
    slug,
    data: result.data,
    error: result.error,
    status: result.status,
    statusText: result.statusText,
    count: result.count,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
