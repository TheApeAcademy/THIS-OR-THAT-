"use client";

import { motion } from "framer-motion";

const CONFETTI_COLORS = [
  "var(--accent)",
  "var(--accent-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

// One-shot burst of dots animating outward and fading - the shared shape
// behind every "big moment" reveal (final verdict, streak milestone, etc).
export function Confetti({ count = 12, radius = 70 }: { count?: number; radius?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              scale: 0.4,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
          />
        );
      })}
    </div>
  );
}
