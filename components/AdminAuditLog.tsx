import { timeAgo } from "@/lib/timeAgo";
import type { AdminActionRow } from "@/lib/actions/admin";

export function AdminAuditLog({ actions }: { actions: AdminActionRow[] }) {
  if (actions.length === 0) {
    return <p className="py-8 text-center text-sm text-text-secondary">No admin actions logged yet.</p>;
  }

  return (
    <div className="space-y-1">
      {actions.map((a) => (
        <div key={a.id} className="rounded-lg border border-border bg-surface-raised p-3 text-sm">
          <p className="text-text-primary">
            <span className="font-semibold">@{a.adminUsername}</span> {a.actionType.replace(/_/g, " ")}{" "}
            <span className="text-text-secondary">
              ({a.targetType} {a.targetId.slice(0, 8)})
            </span>
          </p>
          {a.reason && <p className="mt-0.5 text-xs text-text-secondary">{a.reason}</p>}
          <p className="mt-0.5 text-xs text-text-secondary">{timeAgo(a.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}
