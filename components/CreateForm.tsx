"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import {
  createComparisonAction,
  checkSimilarComparisonsAction,
  type ComparisonVisibility,
  type PostType,
  type SimilarComparison,
} from "@/lib/actions/createComparison";
import { PLAY_SUBJECTS } from "@/lib/playFeed";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { CreateDuelForm } from "@/components/CreateDuelForm";
import { CreatePreview } from "@/components/CreatePreview";
import { CameraIcon } from "@/components/ui/icons";

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
const MAX_OPTIONS = 8;

const POST_TYPES: { value: PostType; label: string; description: string }[] = [
  { value: "this_or_that", label: "This or That", description: "The classic — pick one." },
  { value: "multi_choice", label: "Multi-choice", description: "Up to 8 options." },
  { value: "hot_take", label: "Hot take", description: "One statement, agree or disagree." },
  { value: "ranked_choice", label: "Ranked choice", description: "Voters rank every option." },
];

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
  const [mode, setMode] = useState<"comparison" | "duel">("comparison");
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
  const [postType, setPostType] = useState<PostType>("this_or_that");
  const [hotTakeStatement, setHotTakeStatement] = useState("");
  const [visibility, setVisibility] = useState<ComparisonVisibility>("public");
  const [sensitiveContent, setSensitiveContent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [similar, setSimilar] = useState<SimilarComparison[] | null>(null);
  const [checkingSimilar, setCheckingSimilar] = useState(false);
  const [dismissedSimilarFor, setDismissedSimilarFor] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);
  const isTriviaCategory = selectedCategory?.slug === "trivia";
  const isHotTake = postType === "hot_take";

  const trimmedLabels = options.map((o) => o.label.trim());
  const allFilled = trimmedLabels.every((l) => l.length > 0);
  const noDuplicates = new Set(trimmedLabels.map((l) => l.toLowerCase())).size === trimmedLabels.length;
  const triviaValid = !isTriviaCategory || !isTrivia || (funFact.trim().length > 0 && correctIndex !== null);
  const canSubmit = isHotTake
    ? hotTakeStatement.trim().length > 0 && !isSubmitting
    : allFilled && noDuplicates && triviaValid && !isSubmitting;

  const updateOption = (key: string, patch: Partial<OptionDraft>) => {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  };

  const improveQuestion = async () => {
    if (!prompt.trim() || trimmedLabels.filter(Boolean).length < 2) return;
    setAiLoading(true);
    setAiError(null);
    setAiSuggestion(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<{ suggestion?: string; error?: string }>(
        "improve-question",
        { body: { prompt: prompt.trim(), options: trimmedLabels.filter(Boolean) } }
      );
      if (error || data?.error) {
        setAiError("Couldn't get a suggestion right now.");
      } else if (data?.suggestion) {
        setAiSuggestion(data.suggestion);
      }
    } catch {
      setAiError("Couldn't get a suggestion right now.");
    } finally {
      setAiLoading(false);
    }
  };

  const createAnyway = () => {
    setDismissedSimilarFor(prompt.trim());
    setSimilar(null);
    handleSubmit();
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

    // Skip for hot takes (no real "question" text to compare) and skip
    // re-checking once the user has already seen and dismissed this exact
    // prompt's similar-debates warning.
    if (!isHotTake && prompt.trim() && prompt.trim() !== dismissedSimilarFor) {
      setCheckingSimilar(true);
      const found = await checkSimilarComparisonsAction(prompt).catch(() => []);
      setCheckingSimilar(false);
      if (found.length > 0) {
        setSimilar(found);
        return;
      }
    }

    setSimilar(null);
    setIsSubmitting(true);
    setError(null);
    try {
      const submitOptions = isHotTake
        ? [
            { label: "Agree", imageUrl: null },
            { label: "Disagree", imageUrl: null },
          ]
        : await Promise.all(
            options.map(async (o, i) => ({
              label: trimmedLabels[i],
              imageUrl: o.file ? await uploadImage(o.file) : null,
            }))
          );

      // Date.now() here runs inside this onClick/onPublish handler, never
      // during render, so it's not the render-purity issue this rule exists
      // to catch.
      // eslint-disable-next-line react-hooks/purity
      const expiresAt = expiryHours ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString() : null;
      const id = await createComparisonAction({
        categoryId: categoryId || null,
        prompt: isHotTake ? hotTakeStatement.trim() : prompt.trim() || null,
        options: submitOptions,
        funFact: isTriviaCategory && isTrivia ? funFact.trim() : null,
        subject: isTriviaCategory && isTrivia ? subject || null : null,
        correctOptionIndex: isTriviaCategory && isTrivia ? correctIndex : null,
        expiresAt,
        visibility,
        sensitiveContent,
        postType,
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

      <div className="flex gap-2 rounded-full bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode("comparison")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
            mode === "comparison" ? "bg-accent text-accent-contrast" : "text-text-secondary"
          }`}
        >
          Comparison
        </button>
        <button
          type="button"
          onClick={() => setMode("duel")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
            mode === "duel" ? "bg-accent text-accent-contrast" : "text-text-secondary"
          }`}
        >
          Duel
        </button>
      </div>

      {mode === "duel" ? (
        <CreateDuelForm categories={categories} />
      ) : (
        <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {POST_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setPostType(t.value)}
            title={t.description}
            className={`tap-scale shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              postType === t.value
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border text-text-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {categories.length > 0 && !isHotTake && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`tap-scale shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold ${
                categoryId === c.id
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-text-secondary"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {isHotTake ? (
        <textarea
          value={hotTakeStatement}
          onChange={(e) => setHotTakeStatement(e.target.value)}
          placeholder="State your hot take…"
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
        />
      ) : (
        <>
          <input
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setAiSuggestion(null);
              setSimilar(null);
            }}
            placeholder="Question (optional)"
            maxLength={200}
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
          />

          {prompt.trim().length > 0 && trimmedLabels.filter(Boolean).length >= 2 && !aiSuggestion && (
            <button
              type="button"
              onClick={improveQuestion}
              disabled={aiLoading}
              className="tap-scale text-xs font-semibold text-accent disabled:opacity-50"
            >
              {aiLoading ? "Thinking…" : "✨ Improve my question"}
            </button>
          )}
          {aiError && <p className="text-xs text-text-secondary">{aiError}</p>}
          {aiSuggestion && aiSuggestion !== prompt.trim() && (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-text-secondary">Suggested rewrite</p>
              <p className="text-sm text-text-primary">{aiSuggestion}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setPrompt(aiSuggestion);
                    setAiSuggestion(null);
                  }}
                >
                  Use this
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setAiSuggestion(null)}>
                  Keep mine
                </Button>
              </div>
            </div>
          )}

          {similar && similar.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
              <p className="text-sm font-semibold text-text-primary">Similar debates already exist</p>
              <ul className="space-y-1">
                {similar.map((s) => (
                  <li key={s.id}>
                    <a href={`/comparison/${s.id}`} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
                      {s.prompt}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={createAnyway} disabled={isSubmitting}>
                  Create anyway
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setSimilar(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {postType === "ranked_choice" && (
            <p className="text-xs text-text-secondary">
              Voters will rank these options instead of picking just one.
            </p>
          )}

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
        </>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-raised p-4">
        <div>
          <p className="text-sm font-medium text-text-primary">Who can see this</p>
          <p className="text-xs text-text-secondary">Followers-only debates skip Discover and search.</p>
        </div>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as ComparisonVisibility)}
          className="shrink-0 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
        >
          <option value="public">Everyone</option>
          <option value="followers">Followers only</option>
        </select>
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised p-4 text-sm font-medium text-text-primary">
        <input
          type="checkbox"
          checked={sensitiveContent}
          onChange={(e) => setSensitiveContent(e.target.checked)}
          className="h-4 w-4"
        />
        Mark as sensitive content
      </label>

      {!isHotTake && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-text-secondary">
            Ends in - time-box it so it stops mattering after a deadline
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
      )}

      {isTriviaCategory && !isHotTake && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-text-primary">Make this a trivia question</p>
            <Toggle checked={isTrivia} onChange={setIsTrivia} label="Make this a trivia question" />
          </div>

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
                placeholder="Explain the answer - this shows after voting (required)"
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

      {isHotTake ? (
        <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
          {isSubmitting ? "Publishing…" : "Publish"}
        </Button>
      ) : checkingSimilar ? (
        <Button className="w-full" disabled>
          Checking for similar debates…
        </Button>
      ) : (
        <>
          <Button className="w-full" disabled={!canSubmit} onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>

          {previewOpen && (
            <CreatePreview
              prompt={prompt}
              options={options}
              funFact={isTriviaCategory && isTrivia ? funFact.trim() : null}
              onEdit={() => setPreviewOpen(false)}
              onPublish={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
        </>
      )}
        </>
      )}
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
  const inputId = useId();
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex gap-3">
      <label
        htmlFor={inputId}
        className={clsx(
          "tap-scale relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl",
          !previewUrl && "text-tile"
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <CameraIcon size={26} className="text-white/70" />
        )}
        {previewUrl && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              onFile(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFile(null);
              }
            }}
            className="tap-scale absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
          >
            ×
          </span>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>

      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text-secondary">{label}</p>
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
      </div>
    </div>
  );
}
