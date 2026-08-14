"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, animate, type PanInfo } from "framer-motion";

export interface SwipeCardOption {
  id: string;
  label: string;
  imageUrl?: string | null;
}

interface SwipeCardProps {
  optionA: SwipeCardOption;
  optionB: SwipeCardOption;
  onVote: (optionId: string) => void;
  active: boolean;
}

const SWIPE_DISTANCE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;
const EXIT_DISTANCE = 700;

export function SwipeCard({ optionA, optionB, onVote, active }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-14, 14]);
  const leftGlow = useTransform(x, [-160, 0], [0.9, 0]);
  const rightGlow = useTransform(x, [0, 160], [0, 0.9]);
  const leftScale = useTransform(x, [-160, 0], [1.06, 1]);
  const rightScale = useTransform(x, [0, 160], [1, 1.06]);

  const commit = (direction: "left" | "right") => {
    animate(x, direction === "left" ? -EXIT_DISTANCE : EXIT_DISTANCE, {
      duration: 0.22,
      ease: "easeIn",
    });
    window.setTimeout(() => onVote(direction === "left" ? optionA.id : optionB.id), 180);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
      commit("left");
    } else if (info.offset.x > SWIPE_DISTANCE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD) {
      commit("right");
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 28 });
    }
  };

  return (
    <motion.div
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.85}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 flex overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-lg"
    >
      <motion.div
        style={{ opacity: leftGlow }}
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-accent"
      />
      <motion.div
        style={{ opacity: rightGlow }}
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-accent"
      />

      <motion.button
        type="button"
        style={{ scale: leftScale }}
        onClick={() => active && commit("left")}
        className="relative flex flex-1 flex-col items-center justify-center gap-2 border-r border-border p-6 text-center"
      >
        {optionA.imageUrl && (
          <Image src={optionA.imageUrl} alt={optionA.label} fill className="object-cover opacity-90" />
        )}
        <span className="relative text-2xl font-bold text-text-primary">{optionA.label}</span>
      </motion.button>

      <motion.button
        type="button"
        style={{ scale: rightScale }}
        onClick={() => active && commit("right")}
        className="relative flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center"
      >
        {optionB.imageUrl && (
          <Image src={optionB.imageUrl} alt={optionB.label} fill className="object-cover opacity-90" />
        )}
        <span className="relative text-2xl font-bold text-text-primary">{optionB.label}</span>
      </motion.button>
    </motion.div>
  );
}
