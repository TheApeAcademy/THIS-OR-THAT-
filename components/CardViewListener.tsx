"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { CardViewPopup } from "@/components/CardViewPopup";
import { buzz, HAPTIC } from "@/lib/haptics";

interface QueuedView {
  id: number;
  viewerId: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface CardViewPayload {
  viewer_id: string | null;
}

let nextViewId = 0;

// Mounted app-wide (from the (app) layout) while the owner is logged in, so
// a view is announced no matter which screen they're on - not just while
// they're sitting on their own card page. Renders at most one popup at a
// time; the queue's head IS the rendered popup, dismissed by shifting it off.
export function CardViewListener({ userId }: { userId: string }) {
  const [queue, setQueue] = useState<QueuedView[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`card-views-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "card_views", filter: `owner_id=eq.${userId}` },
        async (payload) => {
          const viewerId = (payload.new as CardViewPayload).viewer_id;
          if (viewerId === userId) return;

          let username: string | null = null;
          let avatarUrl: string | null = null;
          if (viewerId) {
            const { data } = await supabase
              .from("profiles")
              .select("username, profile_photo_url, avatar_url")
              .eq("id", viewerId)
              .maybeSingle();
            username = data?.username ?? null;
            avatarUrl = data?.profile_photo_url ?? data?.avatar_url ?? null;
          }
          buzz(HAPTIC.notify);
          setQueue((prev) => [...prev, { id: nextViewId++, viewerId, username, avatarUrl }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const current = queue[0] ?? null;
  const dismiss = () => setQueue((prev) => prev.slice(1));

  return (
    <AnimatePresence>
      {current && (
        <CardViewPopup key={current.id} username={current.username} avatarUrl={current.avatarUrl} onDismiss={dismiss} />
      )}
    </AnimatePresence>
  );
}
