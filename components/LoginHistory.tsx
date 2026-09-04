"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/timeAgo";
import type { LoginHistoryRow } from "@/lib/actions/security";

export function LoginHistory({ initialHistory }: { initialHistory: LoginHistoryRow[] }) {
  const [signingOut, setSigningOut] = useState(false);

  const signOutOthers = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "others" });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Login history</p>
      {initialHistory.length === 0 ? (
        <p className="text-xs text-text-secondary">No sign-ins logged yet.</p>
      ) : (
        <div className="space-y-1.5">
          {initialHistory.map((row) => (
            <div key={row.id} className="flex items-center justify-between text-xs">
              <span className="text-text-primary">{row.deviceLabel ?? "Unknown device"}</span>
              <span className="text-text-secondary">{timeAgo(row.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
      <Button variant="secondary" size="sm" onClick={signOutOthers} disabled={signingOut}>
        {signingOut ? "Signing out other devices…" : "Sign out of all other devices"}
      </Button>
    </div>
  );
}
