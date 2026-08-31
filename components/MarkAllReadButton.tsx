"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      className="tap-scale text-sm font-medium text-accent disabled:opacity-40"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
    >
      Mark all read
    </button>
  );
}
