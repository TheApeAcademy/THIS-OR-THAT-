"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  removeCommentAction,
  removeComparisonAction,
  resolveReportAction,
  setUserSuspendedAction,
} from "@/lib/actions/admin";

export interface AdminReportRow {
  id: string;
  targetType: "comment" | "comparison" | "profile";
  targetId: string;
  reason: string;
  details: string | null;
  createdAt: string;
  reporterUsername: string;
  preview: string;
  authorUsername: string | null;
  authorId: string | null;
  alreadyRemoved: boolean;
  alreadySuspended?: boolean;
}

export function AdminReportList({ reports }: { reports: AdminReportRow[] }) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  if (reports.length === 0) {
    return <p className="py-12 text-center text-sm text-text-secondary">Nothing to review. All clear.</p>;
  }

  const visible = reports.filter((r) => !dismissedIds.has(r.id));

  const handle = (id: string, fn: () => Promise<unknown>) => {
    startTransition(async () => {
      await fn();
      setDismissedIds((prev) => new Set(prev).add(id));
    });
  };

  return (
    <div className="space-y-3">
      {visible.map((r) => (
        <div key={r.id} className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge>{r.targetType}</Badge>
              <Badge>{r.reason}</Badge>
            </div>
            <span className="text-xs text-text-secondary">reported by @{r.reporterUsername}</span>
          </div>

          <p className="text-sm text-text-primary">{r.preview}</p>
          {r.authorUsername && (
            <p className="text-xs text-text-secondary">by @{r.authorUsername}</p>
          )}
          {r.details && <p className="text-xs text-text-secondary">&ldquo;{r.details}&rdquo;</p>}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => handle(r.id, () => resolveReportAction(r.id, "dismissed"))}
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => handle(r.id, () => resolveReportAction(r.id, "resolved"))}
            >
              Mark resolved
            </Button>
            {(r.targetType === "comment" || r.targetType === "comparison") && !r.alreadyRemoved && (
              <Button
                size="sm"
                variant="secondary"
                className="text-danger"
                disabled={isPending}
                onClick={() =>
                  handle(r.id, async () => {
                    if (r.targetType === "comment") await removeCommentAction(r.targetId);
                    else await removeComparisonAction(r.targetId);
                    await resolveReportAction(r.id, "resolved");
                  })
                }
              >
                Remove content
              </Button>
            )}
            {r.authorId && !r.alreadySuspended && (
              <Button
                size="sm"
                variant="secondary"
                className="text-danger"
                disabled={isPending}
                onClick={() =>
                  handle(r.id, async () => {
                    await setUserSuspendedAction(r.authorId!, true);
                    await resolveReportAction(r.id, "resolved");
                  })
                }
              >
                Suspend account
              </Button>
            )}
          </div>
        </div>
      ))}
      {visible.length === 0 && (
        <p className="py-12 text-center text-sm text-text-secondary">All caught up.</p>
      )}
    </div>
  );
}
