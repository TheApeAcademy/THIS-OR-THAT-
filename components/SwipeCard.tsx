"use client";

import Image from "next/image";
import { motion, useMotionValue, useTransform, animate, type MotionValue, type PanInfo } from "framer-motion";
import { gradientForLabel, letterForLabel } from "@/lib/tileArt";
import { buzz } from "@/lib/haptics";

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
    buzz(18);
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
      className="absolute inset-0 flex gap-1.5 overflow-hidden rounded-[32px] shadow-lg"
    >
      <Half option={optionA} scale={leftScale} glow={leftGlow} onTap={() => active && commit("left")} />
      <Half option={optionB} scale={rightScale} glow={rightGlow} onTap={() => active && commit("right")} />
    </motion.div>
  );
}

function Half({
  option,
  scale,
  glow,
  onTap,
}: {
  option: SwipeCardOption;
  scale: MotionValue<number>;
  glow: MotionValue<number>;
  onTap: () => void;
}) {
  return (
    <motion.button
      type="button"
      style={{ scale }}
      onClick={onTap}
      className="relative flex flex-1 flex-col items-end justify-end overflow-hidden rounded-[26px] p-5 text-center"
    >
      {option.imageUrl ? (
        <Image src={option.imageUrl} alt={option.label} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: gradientForLabel(option.label) }}>
          <span className="absolute inset-0 flex items-center justify-center text-7xl font-black text-white/25">
            {letterForLabel(option.label)}
          </span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
      <motion.div
        style={{ opacity: glow }}
        className="pointer-events-none absolute inset-0 bg-accent mix-blend-overlay"
      />
      <span className="relative w-full text-xl font-extrabold leading-tight tracking-tight text-white">
        {option.label}
      </span>
    </motion.button>
  );
}
