"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { completePasskeySignInAction } from "@/lib/actions/passkeyAuth";

interface AuthOptionsResult {
  options?: Parameters<typeof startAuthentication>[0]["optionsJSON"];
  challengeRowId?: string;
  error?: string;
}

interface AuthVerifyResult {
  tokenHash?: string;
  error?: string;
}

export function PasskeyLoginButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signInWithPasskey = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: optionsData, error: optionsError } =
        await supabase.functions.invoke<AuthOptionsResult>("webauthn-auth-options");
      if (optionsError || !optionsData?.options || !optionsData.challengeRowId) {
        throw new Error(optionsData?.error ?? optionsError?.message ?? "Couldn't start passkey sign-in.");
      }

      const response = await startAuthentication({ optionsJSON: optionsData.options });

      const { data: verifyData, error: verifyError } = await supabase.functions.invoke<AuthVerifyResult>(
        "webauthn-auth-verify",
        { body: { challengeRowId: optionsData.challengeRowId, response } }
      );
      if (verifyError || !verifyData?.tokenHash) {
        throw new Error(verifyData?.error ?? verifyError?.message ?? "Couldn't verify passkey.");
      }

      await completePasskeySignInAction(verifyData.tokenHash);
      router.push("/home");
      router.refresh();
    } catch (e) {
      // A cancelled browser prompt isn't a real error worth showing.
      const name = e instanceof Error ? e.name : "";
      if (name === "NotAllowedError") {
        setSubmitting(false);
        return;
      }
      setError(e instanceof Error ? e.message : "Couldn't sign in with a passkey.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="secondary" onClick={signInWithPasskey} disabled={submitting}>
        {submitting ? "Waiting for passkey…" : "Sign in with a passkey"}
      </Button>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
