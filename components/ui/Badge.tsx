import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-sm bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary",
        className
      )}
      {...props}
    />
  );
}
