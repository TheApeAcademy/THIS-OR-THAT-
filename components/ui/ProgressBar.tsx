"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  percentage: number;
  color?: string;
  trackClassName?: string;
}

export function ProgressBar({ percentage, color = "var(--accent)", trackClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface ${trackClassName ?? ""}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
