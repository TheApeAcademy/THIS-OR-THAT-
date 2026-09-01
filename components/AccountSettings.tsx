"use client";

import { useActionState, useState } from "react";
import { updateEmailAction, updatePasswordAction, requestAccountDeletionAction, type AccountActionState } from "@/lib/actions/account";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { MailIcon, LockIcon, AlertIcon, CheckIcon } from "@/components/ui/icons";

const initialState: AccountActionState = {};

export function AccountSettings({ currentEmail, onClose }: { currentEmail: string; onClose?: () => void }) {
  const [emailState, emailAction, emailPending] = useActionState(updateEmailAction, initialState);
  const [passwordState, passwordAction, passwordPending] = useActionState(updatePasswordAction, initialState);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-sm font-semibold text-text-secondary">Account</p>

      <form action={emailAction} className="space-y-3">
        <FormField
          label="Email"
          icon={<MailIcon size={18} />}
          name="email"
          type="email"
          defaultValue={currentEmail}
          autoComplete="email"
        />
        <Message state={emailState} />
        <Button type="submit" variant="secondary" className="w-full" disabled={emailPending}>
          {emailPending ? "Saving…" : "Update email"}
        </Button>
      </form>

      <form action={passwordAction} className="space-y-3">
        <FormField
          label="New password"
          icon={<LockIcon size={18} />}
          name="password"
          type="password"
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <Message state={passwordState} />
        <Button type="submit" variant="secondary" className="w-full" disabled={passwordPending}>
          {passwordPending ? "Saving…" : "Update password"}
        </Button>
      </form>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Delete account</p>
        <p className="text-xs text-text-secondary">
          Signs you out and requests removal of your account. This can&apos;t be undone once processed.
        </p>
        {confirmingDelete ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <form action={requestAccountDeletionAction} className="flex-1">
              <Button type="submit" variant="danger" className="w-full">
                Confirm delete
              </Button>
            </form>
          </div>
        ) : (
          <Button variant="danger" className="w-full" onClick={() => setConfirmingDelete(true)}>
            Delete my account
          </Button>
        )}
      </div>

      {onClose && (
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      )}
    </div>
  );
}

function Message({ state }: { state: AccountActionState }) {
  if (state.error) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
        <AlertIcon size={14} />
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
        <CheckIcon size={14} />
        {state.success}
      </p>
    );
  }
  return null;
}
