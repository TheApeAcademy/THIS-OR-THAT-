"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { saveProfileAnswersAction } from "@/lib/actions/profileAnswers";
import { PERSONAL_QUESTIONS } from "@/lib/personalQuestions";

export function OnboardingPersonalDetails({ onContinue }: { onContinue: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  const submit = () => {
    startTransition(async () => {
      if (answeredCount > 0) {
        await saveProfileAnswersAction(answers);
      }
      onContinue();
    });
  };

  return (
    <div
      className="flex h-[100dvh] flex-col gap-5 overflow-y-auto px-6 pb-10"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)" }}
    >
      <div>
        <p className="text-2xl font-extrabold tracking-tight text-text-primary">Tell us about you 👋</p>
        <p className="mt-2 text-text-secondary">
          A few quick questions — we&apos;ll turn these into a fun AI bio for your card. Skip any you want.
        </p>
      </div>

      <div className="flex-1 space-y-4">
        {PERSONAL_QUESTIONS.map((q) => (
          <div key={q.key}>
            <label className="mb-1.5 block text-sm font-semibold text-text-primary">{q.prompt}</label>
            <textarea
              value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              maxLength={500}
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button className="w-full" onClick={submit} disabled={isPending}>
          {isPending ? "Saving…" : answeredCount > 0 ? "Continue" : "Skip for now"}
        </Button>
      </div>
    </div>
  );
}
