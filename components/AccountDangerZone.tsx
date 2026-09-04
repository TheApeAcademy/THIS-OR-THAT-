"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { setDeactivatedAction } from "@/lib/actions/settings";
import { createClient } from "@/lib/supabase/client";

interface DeleteAccountResult {
  deleted?: boolean;
  error?: string;
}

export function AccountDangerZone({ initialDeactivated }: { initialDeactivated: boolean }) {
  const router = useRouter();
  const [deactivated, setDeactivated] = useState(initialDeactivated);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const toggleDeactivate = () => {
    const next = !deactivated;
    setDeactivated(next);
    startTransition(() => {
      setDeactivatedAction(next).catch(() => setDeactivated(!next));
    });
  };

  const deleteAccount = async () => {
    if (confirmText !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<DeleteAccountResult>("delete-account");
      if (error || data?.error) throw new Error(data?.error ?? error?.message ?? "Delete failed");
      await supabase.auth.signOut();
      router.push("/");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Couldn't delete your account. Try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-danger/30 bg-surface-raised p-4">
      <p className="text-sm font-semibold text-danger">Danger zone</p>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">
            {deactivated ? "Account deactivated" : "Deactivate account"}
          </p>
          <p className="text-xs text-text-secondary">
            {deactivated
              ? "Your content is hidden from other users. Reactivate any time."
              : "Temporarily hide your content from other users. Reactivate any time."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={toggleDeactivate} className="shrink-0">
          {deactivated ? "Reactivate" : "Deactivate"}
        </Button>
      </div>

      <Button variant="secondary" className="w-full text-danger" onClick={() => setDeleteOpen(true)}>
        Delete account
      </Button>

      <Sheet
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setConfirmText("");
          setDeleteError(null);
        }}
      >
        <div className="space-y-3 py-2">
          <p className="font-semibold text-text-primary">Delete your account?</p>
          <p className="text-sm text-text-secondary">
            This permanently deletes your profile, votes, comments, comparisons and everything else tied
            to your account. This can&rsquo;t be undone.
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-danger"
          />
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          <Button className="w-full" onClick={deleteAccount} disabled={confirmText !== "DELETE" || deleting}>
            {deleting ? "Deleting…" : "Permanently delete my account"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
