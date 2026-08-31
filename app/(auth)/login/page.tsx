"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { MailIcon, LockIcon, AlertIcon } from "@/components/ui/icons";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Welcome back</h1>
      <FormField
        label="Email"
        icon={<MailIcon size={18} />}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
      />
      <FormField
        label="Password"
        icon={<LockIcon size={18} />}
        name="password"
        type="password"
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />
      {state?.error && (
        <motion.p
          initial={{ x: 0 }}
          animate={{ x: [0, -6, 6, -4, 4, 0] }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <AlertIcon size={16} />
          {state.error}
        </motion.p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-text-secondary">
        No account?{" "}
        <Link href="/signup" className="font-medium text-accent">
          Sign up
        </Link>
      </p>
    </form>
  );
}
