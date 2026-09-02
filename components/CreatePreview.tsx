"use client";

import { useEffect, useMemo } from "react";
import { clsx } from "clsx";
import { SquircleTile } from "@/components/SquircleTile";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, LightbulbIcon } from "@/components/ui/icons";
import { tileGridClass, tileSpanClass } from "@/lib/tileLayout";

export interface PreviewOption {
  label: string;
  file: File | null;
}

// A full-screen, non-interactive stand-in for the real FeedSlide card - same
// heading, tile grid, and action row - so a creator sees exactly what their
// post will look like once it's live, before it's actually saved anywhere.
export function CreatePreview({
  prompt,
  options,
  funFact,
  onEdit,
  onPublish,
  isSubmitting,
  error,
}: {
  prompt: string;
  options: PreviewOption[];
  funFact?: string | null;
  onEdit: () => void;
  onPublish: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const previewUrls = useMemo(
    () => options.map((o) => (o.file ? URL.createObjectURL(o.file) : null)),
    [options]
  );
  useEffect(() => {
    return () => {
      for (const url of previewUrls) if (url) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  const heading = prompt.trim() || options.map((o) => o.label.trim() || "?").join(" or ");
  const isBinary = options.length === 2;

  const tiles = options.map((o, i) => (
    <SquircleTile
      key={i}
      onTap={() => {}}
      hasVoted={false}
      chosen={false}
      fill={!isBinary}
      className={!isBinary ? tileSpanClass(options.length, i) : undefined}
      option={{
        id: String(i),
        label: o.label.trim() || `Option ${String.fromCharCode(65 + i)}`,
        imageUrl: previewUrls[i],
      }}
    />
  ));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex shrink-0 items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onEdit}
          disabled={isSubmitting}
          className="tap-scale flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-text-primary"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <p className="flex-1 text-center text-sm font-bold text-text-secondary">Preview</p>
        <div className="h-9 w-9 shrink-0" aria-hidden />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <span className="w-fit rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
          This is how your post will look
        </span>

        {isBinary ? (
          <div className="grid shrink-0 grid-cols-2 gap-3">{tiles}</div>
        ) : (
          <div
            className={clsx("grid shrink-0 gap-3", tileGridClass(options.length))}
            style={{
              aspectRatio: options.length === 6 ? "1 / 2" : options.length === 5 ? "2 / 3" : "1",
            }}
          >
            {tiles}
          </div>
        )}

        <p className="text-3xl font-black leading-[1.1] tracking-tight text-text-primary">{heading}</p>

        {funFact && (
          <p className="flex items-start gap-1.5 text-sm text-text-secondary">
            <LightbulbIcon size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>{funFact}</span>
          </p>
        )}

        <div className="mt-auto flex shrink-0 items-center justify-between pr-1 pt-2 text-sm font-medium text-text-secondary opacity-60">
          <span>❤️ Like</span>
          <span>💬 Comment</span>
          <span>📤 Share</span>
          <span>🔖 Save</span>
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-border px-4 py-3">
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onEdit} disabled={isSubmitting}>
            Edit
          </Button>
          <Button className="flex-1" onClick={onPublish} disabled={isSubmitting}>
            {isSubmitting ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
