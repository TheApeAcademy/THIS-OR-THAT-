"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export function ThemeSettings({ onClose }: { onClose?: () => void }) {
  const { theme, setTheme } = useTheme();
  // Avoid a hydration mismatch: next-themes only knows the resolved theme
  // client-side, so render nothing pressed until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-text-secondary">App theme</p>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            className={clsx(
              "tap-scale flex-1 rounded-xl border px-3 py-3 text-sm font-semibold",
              mounted && theme === opt.value ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {onClose && (
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      )}
    </div>
  );
}
