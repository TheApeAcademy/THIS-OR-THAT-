"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { formatCount } from "@/lib/formatCount";

// Tweens from whatever it last showed to a new value instead of snapping —
// used anywhere a count should feel alive (e.g. engagement going up as
// people vote/comment) rather than static.
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (v) => formatCount(Math.round(v)));
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.6, ease: "easeOut" });
    prevValue.current = value;
    return () => controls.stop();
  }, [value, motionValue]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
