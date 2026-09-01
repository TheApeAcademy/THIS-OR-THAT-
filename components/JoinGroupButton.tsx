"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { joinGroupAction, leaveGroupAction } from "@/lib/actions/groups";
import { buzz } from "@/lib/haptics";

export function JoinGroupButton({
  groupId,
  initialIsMember,
  viewerId = null,
}: {
  groupId: string;
  initialIsMember: boolean;
  viewerId?: string | null;
}) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    const next = !isMember;
    setIsMember(next);
    buzz(next ? 14 : 8);
    startTransition(async () => {
      try {
        if (next) {
          await joinGroupAction(groupId);
        } else {
          await leaveGroupAction(groupId);
        }
        router.refresh();
      } catch {
        setIsMember(!next);
      }
    });
  };

  return (
    <Button variant={isMember ? "secondary" : "primary"} onClick={toggle} disabled={isPending}>
      {isMember ? "Joined" : "Join"}
    </Button>
  );
}
