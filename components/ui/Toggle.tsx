"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";
import { SPRING_SNAPPY } from "@/lib/motion";
import { buzz, HAPTIC } from "@/lib/haptics";

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        buzz(HAPTIC.toggle);
        onChange(!checked);
      }}
      className={clsx(
        "tap-scale relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:opacity-50",
        checked ? "bg-accent" : "bg-border"
      )}
    >
      <motion.span
        layout
        transition={SPRING_SNAPPY}
        className="h-6 w-6 rounded-full bg-white shadow"
        style={{ marginLeft: checked ? "calc(100% - 24px)" : 0 }}
      />
    </button>
  );
}
