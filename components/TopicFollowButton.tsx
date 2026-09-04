"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { toggleTopicFollowAction } from "@/lib/actions/topics";

export function TopicFollowButton({
  topicId,
  viewerId,
  initialFollowing,
}: {
  topicId: string;
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
    toggleTopicFollowAction(topicId, next)
      .catch(() => setFollowing(!next))
      .finally(() => setPending(false));
  };

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.94 }}
      className={clsx(
        "flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
        following ? "glass text-text-primary" : "accent-gradient text-white"
      )}
    >
      {following ? "Following" : "Follow topic"}
    </motion.button>
  );
}
