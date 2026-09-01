"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SPRING_SNAPPY } from "@/lib/motion";

export function CompareForm({
  withUsername,
  viewerUsername,
}: {
  withUsername: string;
  viewerUsername?: string | null;
}) {
  const [myUsername, setMyUsername] = useState("");
  const router = useRouter();

  if (viewerUsername) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SNAPPY}
      >
        <p className="mb-2 text-sm font-semibold text-text-secondary">See how compatible you are</p>
        <Link href={`/compare/${withUsername}/${viewerUsername}`}>
          <Button className="w-full">Compare with @{withUsername}</Button>
        </Link>
      </motion.div>
    );
  }

  const go = () => {
    const trimmed = myUsername.trim();
    if (!trimmed) return;
    router.push(`/compare/${withUsername}/${trimmed}`);
  };

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-text-secondary">Compare with me</p>
      <p className="mb-2 text-xs text-text-secondary">
        <Link href="/login" className="font-medium text-accent">
          Sign in
        </Link>{" "}
        for a one-tap compare, or enter a username below.
      </p>
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
