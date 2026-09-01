"use client";

import { motion } from "framer-motion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SPRING_SMOOTH } from "@/lib/motion";

export interface DnaRow {
  slug: string;
  label: string;
  emoji: string | null;
  pct: number;
  votes: number;
  /** Percentile among real (non-seed) players who have this category, when the sample is large enough to mean anything. */
  percentile?: number;
  sampleSize?: number;
  /** Percentage-point change since the oldest ~monthly history snapshot, when one exists. */
  deltaPct?: number;
}

const MIN_PERCENTILE_SAMPLE = 15;

export function DnaBreakdown({ rows }: { rows: DnaRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        Vote on a few comparisons to build your Preference DNA.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <motion.div
          key={row.slug}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING_SMOOTH, delay: i * 0.04 }}
        >
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-text-primary">
              {row.emoji} {row.label}
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary">
              {row.deltaPct !== undefined && row.deltaPct !== 0 && (
                <span className={row.deltaPct > 0 ? "text-success" : "text-danger"}>
                  {row.deltaPct > 0 ? "↑" : "↓"}
                  {Math.abs(row.deltaPct)}
                </span>
              )}
              {row.pct}%
            </span>
          </div>
          <ProgressBar percentage={row.pct} />
          {row.percentile !== undefined && (row.sampleSize ?? 0) >= MIN_PERCENTILE_SAMPLE && (
            <p className="mt-1 text-xs text-text-secondary">
              More into {row.label} than {row.percentile}% of players
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
