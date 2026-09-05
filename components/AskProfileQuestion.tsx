"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface FunctionResult {
  answer?: string | null;
  needsMoreVotes?: boolean;
  message?: string;
  error?: string;
}

export function AskProfileQuestion() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const ask = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setNote(null);
    setAnswer(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<FunctionResult>("ask-profile-question", {
        body: { question: trimmed },
      });
      if (error) {
        setNote("Something went wrong answering that.");
      } else if (data?.needsMoreVotes) {
        setNote(data.message ?? "Vote on a few more comparisons to unlock this.");
      } else if (data?.error) {
        setNote(data.error);
      } else if (data?.answer) {
        setAnswer(data.answer);
      }
    } catch {
      setNote("Something went wrong answering that.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Ask your profile anything</p>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && ask()}
        placeholder="e.g. Am I more into cars or tech?"
        maxLength={300}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />
      {answer && <p className="text-sm leading-relaxed text-text-primary">{answer}</p>}
      {note && <p className="text-sm text-text-secondary">{note}</p>}
      <Button size="sm" variant="secondary" onClick={ask} disabled={loading || !question.trim()}>
        {loading ? "Thinking…" : "Ask"}
      </Button>
    </div>
  );
}
