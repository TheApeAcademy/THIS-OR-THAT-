"use client";

import { useState, cloneElement, isValidElement } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { ChevronRightIcon } from "@/components/ui/icons";

export function ProfileActionRow({
  icon,
  label,
  trailing,
  href,
  content,
}: {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  /** Renders as a plain nav Link instead of a sheet-trigger when set. */
  href?: string;
  /**
   * Sheet content, e.g. `<EditCardForm ... />`. Must be a plain element (not
   * a function) since this component's parent is a Server Component - a
   * closure can't cross that boundary. We clone in `onClose` so the content
   * doesn't need the parent to wire it up.
   */
  content?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
      {content && (
        <Sheet open={open} onClose={close}>
          {isValidElement(content) ? cloneElement(content as React.ReactElement<{ onClose?: () => void }>, { onClose: close }) : content}
        </Sheet>
      )}
    </>
  );
}
