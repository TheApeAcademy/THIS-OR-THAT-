"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface FunctionResult {
  opinion?: string | null;
  needsMoreActivity?: boolean;
  message?: string;
  error?: string;
}

export function DebateAiOpinion({
  comparisonId,
  initialOpinion,
}: {
  comparisonId: string;
  initialOpinion: string | null;
}) {
  const [opinion, setOpinion] = useState(initialOpinion);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const generate = async (regenerate: boolean) => {
    setLoading(true);
    setNote(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<FunctionResult>("debate-ai-opinion", {
        body: { comparisonId, regenerate },
      });
      if (error) {
        setNote("Something went wrong generating a take.");
      } else if (data?.needsMoreActivity) {
        setNote(data.message ?? "This debate needs a bit more activity first.");
      } else if (data?.error) {
        setNote(data.error);
      } else if (data?.opinion) {
        setOpinion(data.opinion);
      }
    } catch {
      setNote("Something went wrong generating a take.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">🤖 AI take</p>
      {opinion && <p className="text-sm leading-relaxed text-text-primary">{opinion}</p>}
      {note && <p className="text-sm text-text-secondary">{note}</p>}
      <Button size="sm" variant="secondary" onClick={() => generate(!!opinion)} disabled={loading}>
        {loading ? "Thinking…" : opinion ? "Regenerate" : "What's the AI take?"}
      </Button>
    </div>
  );
}
