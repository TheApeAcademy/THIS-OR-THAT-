"use client";

import { useEffect } from "react";
import { logCardViewAction } from "@/lib/actions/cardViews";

// Invisible — fires once per card mount. Deliberately a client-side effect
// (not a server-render side effect) so the separate, server-rendered
// /card/[slug]/opengraph-image route never triggers a view.
export function CardViewTracker({ cardId }: { cardId: string }) {
  useEffect(() => {
    logCardViewAction(cardId).catch(() => {
      // best-effort — a failed view log should never break the card page
    });
  }, [cardId]);

  return null;
}
