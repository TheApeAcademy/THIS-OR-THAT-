"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { SPRING_SMOOTH } from "@/lib/motion";
import { buzz, HAPTIC } from "@/lib/haptics";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ open, onClose, children }: SheetProps) {
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) buzz(HAPTIC.tap);
    mounted.current = true;
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="glass fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-x-0 border-b-0"
            style={{ paddingBottom: "var(--safe-bottom)" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING_SMOOTH}
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
