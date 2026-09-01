"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SPRING_BOUNCY } from "@/lib/motion";
import { buzz, HAPTIC } from "@/lib/haptics";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    buzz(HAPTIC.confirm);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="secondary" className="w-full" onClick={copy}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "copied" : "copy"}
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.9 }}
          transition={SPRING_BOUNCY}
          className="inline-block"
        >
          {copied ? "Link copied!" : "Copy share link"}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
