"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface BackupCodeResult {
  success?: boolean;
  error?: string;
}

export function MfaChallenge() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [usingBackupCode, setUsingBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const totp = data?.totp.find((f) => f.status === "verified");
      setFactorId(totp?.id ?? null);
    });
  }, []);

  const submitTotp = async () => {
    if (!factorId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      router.push("/home");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't work. Try again.");
      setSubmitting(false);
    }
  };

  const submitBackupCode = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: invokeError } = await supabase.functions.invoke<BackupCodeResult>(
        "verify-backup-code",
        { body: { code: code.trim() } }
      );
      if (invokeError || !data?.success) {
        throw new Error(data?.error ?? invokeError?.message ?? "That backup code didn't work.");
      }

      router.push("/home");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That backup code didn't work.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text-primary">Two-factor verification</h1>
      <p className="text-sm text-text-secondary">
        {usingBackupCode
          ? "Enter one of your unused backup codes."
          : "Enter the 6-digit code from your authenticator app."}
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={usingBackupCode ? "Backup code" : "123456"}
        inputMode={usingBackupCode ? "text" : "numeric"}
        autoFocus
        className="rounded-md border border-border bg-surface px-4 py-3 text-center text-lg tracking-widest text-text-primary outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button
        onClick={usingBackupCode ? submitBackupCode : submitTotp}
        disabled={submitting || !code.trim() || (!usingBackupCode && !factorId)}
      >
        {submitting ? "Verifying…" : "Verify"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setUsingBackupCode((v) => !v);
          setCode("");
          setError(null);
        }}
        className="text-center text-sm font-medium text-accent"
      >
        {usingBackupCode ? "Use your authenticator app instead" : "Use a backup code instead"}
      </button>
    </div>
  );
}
