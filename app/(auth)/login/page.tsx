"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { PasskeyLoginButton } from "@/components/PasskeyLoginButton";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text-primary">Welcome back</h1>
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
        autoComplete="current-password"
        placeholder="Password"
        className="rounded-md border border-border bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent"
      />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <div className="flex items-center gap-3 text-xs font-medium text-text-secondary">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>
      <PasskeyLoginButton />
      <p className="text-center text-sm text-text-secondary">
        No account?{" "}
        <Link href="/signup" className="font-medium text-accent">
          Sign up
        </Link>
      </p>
    </form>
  );
}
