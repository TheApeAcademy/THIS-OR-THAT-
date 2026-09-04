"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface BackupCodesResult {
  codes?: string[];
  error?: string;
}

type Step = "idle" | "enrolling" | "codes" | "enabled";

export function TwoFactorSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const [step, setStep] = useState<Step>(initialEnabled ? "enabled" : "idle");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startEnroll = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrollError) throw enrollError;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("enrolling");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start 2FA setup.");
    } finally {
      setBusy(false);
    }
  };

  const verifyEnroll = async () => {
    if (!factorId) return;
    setBusy(true);
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

      const { data: codesData, error: codesError } =
        await supabase.functions.invoke<BackupCodesResult>("generate-backup-codes");
      if (codesError || !codesData?.codes) {
        // 2FA itself is on even if backup codes failed — surface separately.
        setStep("enabled");
        setError("2FA is on, but backup codes couldn't be generated. Try regenerating them below.");
        return;
      }

      setCodes(codesData.codes);
      setStep("codes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't match. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp.find((f) => f.status === "verified");
      if (totp) await supabase.auth.mfa.unenroll({ factorId: totp.id });
      setStep("idle");
      setFactorId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't disable 2FA.");
    } finally {
      setBusy(false);
    }
  };

  const regenerateCodes = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: codesError } =
        await supabase.functions.invoke<BackupCodesResult>("generate-backup-codes");
      if (codesError || !data?.codes) throw new Error(data?.error ?? codesError?.message);
      setCodes(data.codes);
      setStep("codes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't generate backup codes.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Two-factor authentication</p>

      {step === "idle" && (
        <>
          <p className="text-xs text-text-secondary">
            Add a second step at sign-in using an authenticator app (Google Authenticator, Authy, 1Password…).
          </p>
          <Button variant="secondary" size="sm" onClick={startEnroll} disabled={busy}>
            Enable 2FA
          </Button>
        </>
      )}

      {step === "enrolling" && (
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">Scan this in your authenticator app:</p>
          {qrCode && (
            // eslint-disable-next-line @next/next/no-img-element -- data: URI SVG, not a static asset
            <img src={qrCode} alt="2FA QR code" width={180} height={180} className="mx-auto" />
          )}
          {secret && (
            <p className="break-all text-center text-xs text-text-secondary">
              Or enter this code manually: <span className="font-mono">{secret}</span>
            </p>
          )}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-center text-lg tracking-widest text-text-primary outline-none focus:border-accent"
          />
          <Button size="sm" onClick={verifyEnroll} disabled={busy || !code.trim()}>
            Confirm
          </Button>
        </div>
      )}

      {step === "codes" && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-primary">
            Save these backup codes somewhere safe. Each works once if you lose your authenticator.
          </p>
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-surface p-3 font-mono text-sm text-text-primary">
            {codes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <Button size="sm" onClick={() => setStep("enabled")}>
            I&apos;ve saved these
          </Button>
        </div>
      )}

      {step === "enabled" && (
        <div className="space-y-2">
          <p className="text-xs text-text-secondary">2FA is on for your account.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={regenerateCodes} disabled={busy}>
              Regenerate backup codes
            </Button>
            <Button variant="secondary" size="sm" className="text-danger" onClick={disable} disabled={busy}>
              Disable 2FA
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
