"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { saveProfileAnswersAction } from "@/lib/actions/profileAnswers";
import { PERSONAL_QUESTIONS } from "@/lib/personalQuestions";

interface AiBioResult {
  bio?: string | null;
  needsMoreAnswers?: boolean;
  message?: string;
  error?: string;
}

export function PersonalDetailsFlow({
  initialAnswers,
  initialAiBio,
}: {
  initialAnswers: Record<string, string>;
  initialAiBio: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [aiBio, setAiBio] = useState(initialAiBio);
  const [generating, setGenerating] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  const save = () => {
    startTransition(async () => {
      await saveProfileAnswersAction(answers);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const generateBio = async () => {
    setGenerating(true);
    setNote(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<AiBioResult>("summarize-profile-answers");
      if (error) {
        setNote("Something went wrong generating your bio.");
      } else if (data?.needsMoreAnswers) {
        setNote(data.message ?? "Answer a few more questions to unlock this.");
      } else if (data?.error) {
        setNote(data.error);
      } else if (data?.bio) {
        setAiBio(data.bio);
      }
    } catch {
      setNote("Something went wrong generating your bio.");
    } finally {
      setGenerating(false);
    }
  };

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        {answeredCount > 0 ? "Update personal details" : "Build my personal details"}
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-raised p-4">
      <div>
        <p className="text-sm font-semibold text-text-secondary">Personal details</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          Answer a few questions — your AI bio below is built from these, not shown word-for-word.
        </p>
      </div>

      <div className="space-y-3">
        {PERSONAL_QUESTIONS.map((q) => (
          <div key={q.key}>
            <label className="mb-1 block text-xs font-semibold text-text-primary">{q.prompt}</label>
            <textarea
              value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              maxLength={500}
              rows={2}
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : saved ? "Saved!" : "Save answers"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-sm font-semibold text-text-secondary">AI bio for your card</p>
        {aiBio && <p className="text-sm leading-relaxed text-text-primary">&ldquo;{aiBio}&rdquo;</p>}
        {note && <p className="text-sm text-text-secondary">{note}</p>}
        <Button size="sm" variant="secondary" onClick={generateBio} disabled={generating}>
          {generating ? "Thinking…" : aiBio ? "Regenerate bio" : "Generate my bio"}
        </Button>
      </div>
    </div>
  );
}
