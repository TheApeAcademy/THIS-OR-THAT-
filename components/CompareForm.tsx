"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CompareForm({ withUsername }: { withUsername: string }) {
  const [myUsername, setMyUsername] = useState("");
  const router = useRouter();

  const go = () => {
    const trimmed = myUsername.trim();
    if (!trimmed) return;
    router.push(`/compare/${withUsername}/${trimmed}`);
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-secondary">Compare with me</p>
      <div className="flex gap-2">
        <input
          value={myUsername}
          onChange={(e) => setMyUsername(e.target.value)}
          placeholder="Your username"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
        <Button size="sm" onClick={go} disabled={!myUsername.trim()}>
          Compare
        </Button>
      </div>
    </div>
  );
}
