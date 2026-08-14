"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  if (state?.needsConfirmation) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xl font-semibold text-text-primary">Check your email</p>
        <p className="text-text-secondary">
          We sent you a confirmation link. Open it to activate your account, then come back and
          sign in.
        </p>
        <Link href="/login" className="mt-4 font-medium text-accent">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text-primary">Let&rsquo;s figure you out 👀</h1>
      <input
        name="username"
        type="text"
        required
        placeholder="Username"
        className="rounded-md border border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent"
      />
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        className="rounded-md border border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent"
      />
      <input
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        placeholder="Password"
        className="rounded-md border border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </form>
  );
}
