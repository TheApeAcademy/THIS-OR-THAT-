"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { UserIcon, MailIcon, LockIcon, AlertIcon, CheckIcon } from "@/components/ui/icons";
import { SPRING_BOUNCY } from "@/lib/motion";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  if (state?.needsConfirmation) {
    return (
      <div className="glass flex flex-col items-center gap-2 rounded-xl px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_BOUNCY}
          className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <CheckIcon size={28} />
        </motion.div>
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
      <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Let&rsquo;s figure you out</h1>
      <FormField
        label="Username"
        icon={<UserIcon size={18} />}
        name="username"
        type="text"
        required
        placeholder="yourname"
      />
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
        minLength={6}
        autoComplete="new-password"
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
