"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SPRING_SMOOTH, SPRING_SNAPPY } from "@/lib/motion";

export interface TourStep {
  selector: string;
  title: string;
  body: string;
}

export function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onSkip,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onSkip: () => void;
}) {
  const pad = 8;
  const cutout = targetRect
    ? {
        left: targetRect.left - pad,
        top: targetRect.top - pad,
        width: targetRect.width + pad * 2,
        height: targetRect.height + pad * 2,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[60]">
      {cutout ? (
        <motion.div
          animate={{ left: cutout.left, top: cutout.top, width: cutout.width, height: cutout.height }}
          transition={SPRING_SMOOTH}
          className="absolute rounded-2xl"
          style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)" }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/72" />
      )}

      {/* Anchored to a fixed spot near the bottom, never derived from the
          spotlighted element's size/position - a cutout that covers most of
          the screen (e.g. the whole feed) must never be able to push this
          off-screen, since it's the only way to advance or dismiss the tour. */}
      <motion.div
        key={`tooltip-${stepIndex}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING_SNAPPY}
        className="glass fixed inset-x-4 mx-auto max-w-sm rounded-2xl p-4"
        style={{ bottom: "calc(var(--safe-bottom) + 84px)" }}
      >
        <p className="text-sm font-bold text-text-primary">{step.title}</p>
        <p className="mt-1 text-sm text-text-secondary">{step.body}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === stepIndex ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onSkip} className="tap-scale text-xs font-semibold text-text-secondary">
              Skip tour
            </button>
            <Button size="sm" onClick={onNext}>
              {stepIndex === totalSteps - 1 ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
