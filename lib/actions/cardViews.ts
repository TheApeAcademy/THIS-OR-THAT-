"use server";

import { createClient } from "@/lib/supabase/server";

const RATE_WINDOW_MINUTES = 30;

// Logs a card view, respecting card_views' anon-tolerant insert policy.
// Called client-side from CardViewTracker (a useEffect, never from the
// server-rendered opengraph-image route) so link-preview crawlers never
// count as a view. Skips self-views and repeat views from the same signed-in
// viewer within a short window.
export async function logCardViewAction(cardId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  const { data: card } = await supabase.from("cards").select("id, user_id").eq("id", cardId).maybeSingle();
  if (!card) return;
  if (viewerId && viewerId === card.user_id) return;

  if (viewerId) {
    const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("card_views")
      .select("id")
      .eq("card_id", cardId)
      .eq("viewer_id", viewerId)
      .gt("created_at", since)
      .limit(1)
      .maybeSingle();
    if (recent) return;
  }

  await supabase.from("card_views").insert({ card_id: cardId, owner_id: card.user_id, viewer_id: viewerId });
}
