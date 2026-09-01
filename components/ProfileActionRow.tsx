"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { ChevronRightIcon } from "@/components/ui/icons";

export function ProfileActionRow({
  icon,
  label,
  trailing,
  href,
  renderContent,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  /** Renders as a plain nav Link instead of a sheet-trigger when set. */
  href?: string;
  /** Sheet content — receives a close() callback so the content's own Close/Save-and-close buttons can dismiss it. */
  renderContent?: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const row = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-text-primary">{label}</span>
      {trailing}
      <ChevronRightIcon size={16} className="text-text-secondary" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left">
        {row}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-scale flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
      >
        {row}
      </button>
      {renderContent && <Sheet open={open} onClose={() => setOpen(false)}>{renderContent(() => setOpen(false))}</Sheet>}
    </>
  );
}
