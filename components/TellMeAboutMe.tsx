"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface FunctionResult {
  summary?: string | null;
  needsMoreVotes?: boolean;
  message?: string;
  error?: string;
}

export function TellMeAboutMe({ initialSummary }: { initialSummary: string | null }) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setNote(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<FunctionResult>("tell-me-about-me");

      if (error) {
        setNote("Something went wrong generating your summary.");
      } else if (data?.needsMoreVotes) {
        setNote(data.message ?? "Vote on a few more comparisons to unlock this.");
      } else if (data?.error) {
        setNote(data.error);
      } else if (data?.summary) {
        setSummary(data.summary);
      }
    } catch {
      setNote("Something went wrong generating your summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Tell me about me</p>
      {summary && <p className="text-sm leading-relaxed text-text-primary">{summary}</p>}
      {note && <p className="text-sm text-text-secondary">{note}</p>}
      <Button size="sm" variant="secondary" onClick={generate} disabled={loading}>
        {loading ? "Thinking…" : summary ? "Regenerate" : "Ask my AI"}
      </Button>
    </div>
  );
}
