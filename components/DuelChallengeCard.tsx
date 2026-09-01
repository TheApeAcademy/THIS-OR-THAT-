"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { respondToDuelAction } from "@/lib/actions/duels";
import { buzz, HAPTIC } from "@/lib/haptics";
import { SPRING_SMOOTH } from "@/lib/motion";

export interface DuelChallengeSummary {
  id: string;
  prompt: string | null;
  challengerLabel: string;
  challengerStatement: string | null;
  isDirect: boolean;
  challenger: { username: string; avatarUrl: string | null };
}

export function DuelChallengeCard({ challenge }: { challenge: DuelChallengeSummary }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState("");
  const [statement, setStatement] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<"accepted" | "declined" | null>(null);

  const decline = () => {
    startTransition(async () => {
      try {
        await respondToDuelAction(challenge.id, false);
        buzz(8);
        setResolved("declined");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  const accept = () => {
    if (!label.trim()) {
      setError("Write your side of the debate first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const comparisonId = await respondToDuelAction(challenge.id, true, label, statement);
        buzz([...HAPTIC.success]);
        setResolved("accepted");
        if (comparisonId) router.push(`/comparison/${comparisonId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Someone may have already claimed this.");
      }
    });
  };

  if (resolved === "declined") {
    return <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-secondary">Declined.</div>;
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center gap-2.5">
        <Avatar name={challenge.challenger.username} src={challenge.challenger.avatarUrl} size={32} />
        <p className="text-sm font-semibold text-text-primary">@{challenge.challenger.username} says:</p>
      </div>
      {challenge.prompt && <p className="text-sm font-bold text-text-primary">{challenge.prompt}</p>}
      <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm font-semibold text-text-primary">
        {challenge.challengerLabel}
        {challenge.challengerStatement && (
          <span className="mt-1 block text-xs font-normal text-text-secondary">
            &ldquo;{challenge.challengerStatement}&rdquo;
          </span>
        )}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {!expanded ? (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2"
          >
            <Button className="flex-1" onClick={() => setExpanded(true)} disabled={isPending}>
              Take the other side
            </Button>
            {challenge.isDirect && (
              <Button variant="secondary" onClick={decline} disabled={isPending}>
                Decline
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING_SMOOTH}
            className="space-y-2 overflow-hidden"
          >
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Your stance, e.g. 'Kendrick'"
              maxLength={60}
              className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Make your case (optional)"
              maxLength={220}
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={accept} disabled={isPending}>
                {isPending ? "Starting…" : "Post my side"}
              </Button>
              <Button variant="secondary" onClick={() => setExpanded(false)} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
