"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createComparisonAction,
  type ComparisonVisibility,
  type PostType,
} from "@/lib/actions/createComparison";
import { saveDraftAction, type DraftInput } from "@/lib/actions/drafts";
import { PLAY_SUBJECTS } from "@/lib/playFeed";
import { Button } from "@/components/ui/Button";
import { prepareImageForUpload } from "@/lib/imageEdit";
import { uploadToStorage } from "@/lib/storageUpload";

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
  rotation: number;
}

export interface InitialDraft {
  id: string;
  categoryId: string | null;
  prompt: string | null;
  visibility: ComparisonVisibility;
  options: { label: string; imageUrl: string | null }[];
}

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;

const POST_TYPES: { value: PostType; label: string; description: string }[] = [
  { value: "this_or_that", label: "This or That", description: "The classic — pick one." },
  { value: "multi_choice", label: "Multi-choice", description: "Up to 8 options." },
  { value: "hot_take", label: "Hot take", description: "One statement, agree or disagree." },
  { value: "ranked_choice", label: "Ranked choice", description: "Voters rank every option." },
];

async function uploadImage(
  file: File,
  rotation: number,
  onProgress?: (pct: number) => void
): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const prepared = await prepareImageForUpload(file, rotation);
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;

  return uploadToStorage("comparison-images", path, prepared, { onProgress, retries: 2 });
}

export function CreateForm({
  categories,
  initialDraft,
}: {
  categories: Category[];
  initialDraft?: InitialDraft | null;
}) {
  const router = useRouter();
  const makeKey = useId();
  const [draftId, setDraftId] = useState(initialDraft?.id ?? null);
  const [categoryId, setCategoryId] = useState(initialDraft?.categoryId ?? categories[0]?.id ?? "");
  const [prompt, setPrompt] = useState(initialDraft?.prompt ?? "");
  const [visibility, setVisibility] = useState<ComparisonVisibility>(initialDraft?.visibility ?? "public");
  const [sensitiveContent, setSensitiveContent] = useState(false);
  const [postType, setPostType] = useState<PostType>("this_or_that");
  const [hotTakeStatement, setHotTakeStatement] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>(
    initialDraft && initialDraft.options.length >= MIN_OPTIONS
      ? initialDraft.options.map((o, i) => ({ key: `${makeKey}-${i}`, label: o.label, file: null, rotation: 0 }))
      : [
          { key: `${makeKey}-0`, label: "", file: null, rotation: 0 },
          { key: `${makeKey}-1`, label: "", file: null, rotation: 0 },
        ]
  );
  const [isTrivia, setIsTrivia] = useState(false);
  const [funFact, setFunFact] = useState("");
  const [subject, setSubject] = useState("");
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const uploadedUrls = useRef<Map<File, string>>(new Map()).current;

  const selectedCategory = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);
  const isTriviaCategory = selectedCategory?.slug === "trivia";

  const trimmedLabels = options.map((o) => o.label.trim());
  const allFilled = trimmedLabels.every((l) => l.length > 0);
  const noDuplicates = new Set(trimmedLabels.map((l) => l.toLowerCase())).size === trimmedLabels.length;
  const triviaValid = !isTriviaCategory || !isTrivia || (funFact.trim().length > 0 && correctIndex !== null);
  const isHotTake = postType === "hot_take";
  const canSubmit = isHotTake
    ? hotTakeStatement.trim().length > 0 && !isSubmitting
    : allFilled && noDuplicates && triviaValid && !isSubmitting;

  const updateOption = (key: string, patch: Partial<OptionDraft>) => {
    setOptions((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [
      ...prev,
      { key: `${makeKey}-${prev.length}-${Date.now()}`, label: "", file: null, rotation: 0 },
    ]);
  };

  const removeOption = (key: string) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((o) => o.key !== key));
  };

  const saveDraft = async () => {
    setIsSavingDraft(true);
    setError(null);
    try {
      const input: DraftInput = {
        id: draftId ?? undefined,
        categoryId: categoryId || null,
        prompt: prompt.trim() || null,
        visibility,
        // Drafts persist label text only — an unuploaded image (a raw
        // browser File) can't survive a page reload, so photos need to be
        // re-added when a draft is resumed. Text progress is preserved.
        options: options.map((o) => ({ label: o.label, imageUrl: null })),
      };
      const id = await saveDraftAction(input);
      setDraftId(id);
      setDraftSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const submitOptions = isHotTake
        ? [
            { label: "Agree", imageUrl: null },
            { label: "Disagree", imageUrl: null },
          ]
        : await Promise.all(
            options.map(async (o, i) => {
              if (!o.file) return { label: trimmedLabels[i], imageUrl: null };
              const cached = uploadedUrls.get(o.file);
              if (cached) return { label: trimmedLabels[i], imageUrl: cached };
              const url = await uploadImage(o.file, o.rotation, (pct) =>
                setUploadProgress((prev) => ({ ...prev, [o.key]: pct }))
              );
              uploadedUrls.set(o.file, url);
              return { label: trimmedLabels[i], imageUrl: url };
            })
          );

      const id = await createComparisonAction({
        categoryId: categoryId || null,
        prompt: isHotTake ? hotTakeStatement.trim() : prompt.trim() || null,
        options: submitOptions,
        funFact: isTriviaCategory && isTrivia ? funFact.trim() : null,
        subject: isTriviaCategory && isTrivia ? subject || null : null,
        correctOptionIndex: isTriviaCategory && isTrivia ? correctIndex : null,
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

      <div className="flex gap-2 overflow-x-auto pb-1">
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
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Question (optional)"
            maxLength={200}
            className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
          />

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
              onFile={(f) => updateOption(option.key, { file: f, rotation: 0 })}
              rotation={option.rotation}
              onRotate={() => updateOption(option.key, { rotation: (option.rotation + 90) % 360 })}
              uploadPct={isSubmitting ? uploadProgress[option.key] : undefined}
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

      {isTriviaCategory && !isHotTake && (
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

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={saveDraft} disabled={isSavingDraft}>
          {isSavingDraft ? "Saving…" : draftSavedAt ? "Draft saved ✓" : "Save as draft"}
        </Button>
        <Button className="flex-1" disabled={!canSubmit} onClick={handleSubmit}>
          {isSubmitting ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </div>
  );
}

function OptionField({
  label,
  value,
  onChange,
  file,
  onFile,
  rotation,
  onRotate,
  uploadPct,
  onRemove,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  file: File | null;
  onFile: (f: File | null) => void;
  rotation: number;
  onRotate: () => void;
  uploadPct?: number;
  onRemove?: () => void;
}) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

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

      {previewUrl && (
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a remote/optimizable image */}
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <button
              type="button"
              aria-label="Rotate photo 90 degrees"
              onClick={onRotate}
              className="tap-scale w-fit rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text-secondary"
            >
              ↻ Rotate
            </button>
            {uploadPct !== undefined && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-[width]"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

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
