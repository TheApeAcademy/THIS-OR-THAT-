"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { removePasskeyAction, type PasskeyRow } from "@/lib/actions/passkeys";
import { deviceLabelFromUserAgent } from "@/lib/deviceLabel";

interface RegisterOptionsResult {
  options?: Parameters<typeof startRegistration>[0]["optionsJSON"];
  error?: string;
}

interface RegisterVerifyResult {
  success?: boolean;
  error?: string;
}

export function PasskeySettings({ initialPasskeys }: { initialPasskeys: PasskeyRow[] }) {
  const [passkeys, setPasskeys] = useState(initialPasskeys);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const addPasskey = async () => {
    setRegistering(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: optionsData, error: optionsError } =
        await supabase.functions.invoke<RegisterOptionsResult>("webauthn-register-options");
      if (optionsError || !optionsData?.options) {
        throw new Error(optionsData?.error ?? optionsError?.message ?? "Couldn't start passkey setup.");
      }

      const response = await startRegistration({ optionsJSON: optionsData.options });
      const deviceLabel = deviceLabelFromUserAgent(navigator.userAgent);

      const { data: verifyData, error: verifyError } =
        await supabase.functions.invoke<RegisterVerifyResult>("webauthn-register-verify", {
          body: { response, deviceLabel },
        });
      if (verifyError || !verifyData?.success) {
        throw new Error(verifyData?.error ?? verifyError?.message ?? "Couldn't save passkey.");
      }

      setPasskeys((prev) => [
        { id: crypto.randomUUID(), deviceLabel, createdAt: new Date().toISOString(), lastUsedAt: null },
        ...prev,
      ]);
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      if (name !== "NotAllowedError") {
        setError(e instanceof Error ? e.message : "Couldn't add a passkey.");
      }
    } finally {
      setRegistering(false);
    }
  };

  const remove = (id: string) => {
    setPasskeys((prev) => prev.filter((p) => p.id !== id));
    startTransition(() => {
      removePasskeyAction(id).catch(() => {});
    });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Passkeys</p>
      <p className="text-xs text-text-secondary">
        Sign in with your device&apos;s fingerprint, face, or screen lock instead of a password.
      </p>

      {passkeys.length > 0 && (
        <div className="space-y-2">
          {passkeys.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-text-primary">{p.deviceLabel ?? "Passkey"}</span>
              <button onClick={() => remove(p.id)} className="text-xs font-medium text-danger underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button variant="secondary" size="sm" onClick={addPasskey} disabled={registering}>
        {registering ? "Waiting for device…" : "Add a passkey"}
      </Button>
    </div>
  );
}
