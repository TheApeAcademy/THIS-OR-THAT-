"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createComparisonAction } from "@/lib/actions/createComparison";
import { PLAY_SUBJECTS } from "@/lib/playFeed";
import { Button } from "@/components/ui/Button";

interface Category {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
}

interface OptionDraft {
  key: string;
  label: string;
  file: File | null;
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const EXPIRY_OPTIONS = [
  { label: "No limit", hours: null },
  { label: "1 hour", hours: 1 },
  { label: "4 hours", hours: 4 },
  { label: "8 hours", hours: 8 },
  { label: "24 hours", hours: 24 },
] as const;

async function uploadImage(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("comparison-images").upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from("comparison-images").getPublicUrl(path);
  return data.publicUrl;
}

export function CreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const makeKey = useId();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([
    { key: `${makeKey}-0`, label: "", file: null },
    { key: `${makeKey}-1`, label: "", file: null },
  ]);
  const [isTrivia, setIsTrivia] = useState(false);
  const [funFact, setFunFact] = useState("");
  const [subject, setSubject] = useState("");
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [expiryHours, setExpiryHours] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);
  const isTriviaCategory = selectedCategory?.slug === "trivia";

  const trimmedLabels = options.map((o) => o.label.trim());
  const allFilled = trimmedLabels.every((l) => l.length > 0);
  const noDuplicates = new Set(trimmedLabels.map((l) => l.toLowerCase())).size === trimmedLabels.length;
  const triviaValid = !isTriviaCategory || !isTrivia || (funFact.trim().length > 0 && correctIndex !== null);
  const canSubmit = allFilled && noDuplicates && triviaValid && !isSubmitting;

  const updateOption = (key: string, patch: Partial<OptionDraft>) => {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, { key: `${makeKey}-${prev.length}-${Date.now()}`, label: "", file: null }]);
  };

  const removeOption = (key: string) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((o) => o.key !== key));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const imageUrls = await Promise.all(
        options.map((o) => (o.file ? uploadImage(o.file) : Promise.resolve(null)))
      );

      const id = await createComparisonAction({
        categoryId: categoryId || null,
        prompt: prompt.trim() || null,
        options: options.map((o, i) => ({ label: o.label.trim(), imageUrl: imageUrls[i] })),
        funFact: isTriviaCategory && isTrivia ? funFact.trim() : null,
        subject: isTriviaCategory && isTrivia ? subject || null : null,
        correctOptionIndex: isTriviaCategory && isTrivia ? correctIndex : null,
        expiresAt: expiryHours ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString() : null,
      });

      router.push(`/comparison/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-4">
      <h1 className="text-2xl font-bold text-text-primary">Create</h1>

      {categories.length > 0 && (
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      )}

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Question (optional)"
        maxLength={200}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />

      {options.map((option, i) => (
        <OptionField
          key={option.key}
          label={`Option ${String.fromCharCode(65 + i)}`}
          value={option.label}
          onChange={(v) => updateOption(option.key, { label: v })}
          file={option.file}
          onFile={(f) => updateOption(option.key, { file: f })}
          onRemove={options.length > MIN_OPTIONS ? () => removeOption(option.key) : undefined}
        />
      ))}

      {options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={addOption}
          className="tap-scale w-full rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-accent"
        >
          + Add another option
        </button>
      )}

      {!noDuplicates && (
        <p className="text-sm text-danger">Options need to be different from each other.</p>
      )}

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">
          Ends in — time-box it so it stops mattering after a deadline
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPIRY_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setExpiryHours(opt.hours)}
              className={`tap-scale rounded-full border px-3 py-1.5 text-sm font-medium ${
                expiryHours === opt.hours
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isTriviaCategory && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <input
              type="checkbox"
              checked={isTrivia}
              onChange={(e) => setIsTrivia(e.target.checked)}
              className="h-4 w-4"
            />
            Make this a trivia question
          </label>

          {isTrivia && (
            <>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-text-secondary">Which option is correct?</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((o, i) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => setCorrectIndex(i)}
                      className={`tap-scale rounded-full border px-3 py-1.5 text-sm font-medium ${
                        correctIndex === i
                          ? "border-accent bg-accent/15 text-accent"
                          : "border-border text-text-secondary"
                      }`}
                    >
                      {o.label.trim() || `Option ${String.fromCharCode(65 + i)}`}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={funFact}
                onChange={(e) => setFunFact(e.target.value)}
                placeholder="Explain the answer — this shows after voting (required)"
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
              />

              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
              >
                <option value="">No subject (shows under &quot;All&quot; in Play)</option>
                {PLAY_SUBJECTS.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.emoji} {s.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
        {isSubmitting ? "Publishing…" : "Publish"}
      </Button>
    </div>
  );
}

function OptionField({
  label,
  value,
  onChange,
  file,
  onFile,
  onRemove,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  file: File | null;
  onFile: (f: File | null) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-secondary">{label}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="tap-scale text-xs font-medium text-danger">
            Remove
          </button>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. BMW"
        maxLength={60}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className="w-full text-sm text-text-secondary"
      />
      {file && <p className="text-xs text-text-secondary">{file.name}</p>}
    </div>
  );
}
