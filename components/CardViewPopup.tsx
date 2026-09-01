"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { SPRING_SNAPPY } from "@/lib/motion";

export function CardViewPopup({
  username,
  avatarUrl,
  onDismiss,
}: {
  username: string | null;
  avatarUrl: string | null;
  onDismiss: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={SPRING_SNAPPY}
      onClick={() => {
        if (username) router.push("/profile/connections");
        onDismiss();
      }}
      className="glass-chrome fixed inset-x-4 z-50 mx-auto flex max-w-sm cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
      style={{ top: "calc(var(--safe-top) + 52px)" }}
    >
      <Avatar name={username ?? "?"} src={avatarUrl} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">
          {username ? `@${username} viewed your card` : "Someone viewed your card"}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">This or That</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="tap-scale shrink-0 text-sm font-bold text-text-secondary"
      >
        ✕
      </button>
    </motion.div>
  );
}
