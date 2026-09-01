"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "clsx";
import { TrophyIcon, ScaleIcon } from "@/components/ui/icons";
import { SPRING_BOUNCY } from "@/lib/motion";
import { buzz, HAPTIC } from "@/lib/haptics";

export type VerdictState = "winning" | "tied" | undefined;

// Small corner pill shown once results are visible, marking the option(s)
// currently ahead. Re-pops (and buzzes once) when the state actually
// changes — e.g. a live vote flips the lead while the card is open — not
// on every unrelated re-render.
export function VerdictBadge({ state, className }: { state: VerdictState; className?: string }) {
  const prevState = useRef<VerdictState>(undefined);

  useEffect(() => {
    if (state && state !== prevState.current) buzz([...HAPTIC.success]);
    prevState.current = state;
  }, [state]);

  return (
    <AnimatePresence>
      {state && (
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.4, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.4 }}
          transition={SPRING_BOUNCY}
          className={clsx(
            "absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-white",
            state === "winning" ? "bg-success" : "bg-accent",
            className
          )}
        >
          {state === "winning" ? <TrophyIcon size={11} /> : <ScaleIcon size={11} />}
          {state === "winning" ? "Winning" : "Tied"}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
