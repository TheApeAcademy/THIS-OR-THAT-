"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { toggleTopicFollowAction } from "@/lib/actions/topics";
import { buzz } from "@/lib/haptics";

export function TopicFollowButton({
  topicId,
  initialFollowing,
}: {
  topicId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  const toggle = () => {
    if (pending) return;
    const next = !following;
    setPending(true);
    setFollowing(next);
    buzz(next ? 14 : 8);
    toggleTopicFollowAction(topicId, next)
      .catch(() => setFollowing(!next))
      .finally(() => setPending(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        "tap-scale shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors",
        following ? "glass text-text-primary" : "accent-gradient text-white"
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
