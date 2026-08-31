"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { toggleFollowAction } from "@/lib/actions/follows";

export function CardFollowButton({
  profileUserId,
  viewerId,
  initialFollowing,
}: {
  profileUserId: string;
  viewerId: string | null;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  const toggle = () => {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    if (pending) return;
    const next = !following;
    setPending(true);
    setFollowing(next);
    try {
      navigator.vibrate?.(next ? 14 : 8);
    } catch {
      // unsupported — ignore
    }
    toggleFollowAction(profileUserId, next)
      .catch(() => setFollowing(!next))
      .finally(() => setPending(false));
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.94 }}
      className={clsx(
        "mx-auto flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
        following ? "glass text-text-primary" : "accent-gradient text-white"
      )}
    >
      {following ? (
        "Following"
      ) : (
        <>
          <PlusIcon /> Follow
        </>
      )}
    </motion.button>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
