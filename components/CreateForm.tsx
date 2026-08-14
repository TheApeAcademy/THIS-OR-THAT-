"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createComparisonAction } from "@/lib/actions/createComparison";
import { Button } from "@/components/ui/Button";

interface Category {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
}

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
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [labelA, setLabelA] = useState("");
  const [labelB, setLabelB] = useState("");
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = labelA.trim().length > 0 && labelB.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const [imageUrlA, imageUrlB] = await Promise.all([
        fileA ? uploadImage(fileA) : Promise.resolve(null),
        fileB ? uploadImage(fileB) : Promise.resolve(null),
      ]);

      const id = await createComparisonAction({
        categoryId: categoryId || null,
        prompt: prompt.trim() || null,
        optionA: { label: labelA.trim(), imageUrl: imageUrlA },
        optionB: { label: labelB.trim(), imageUrl: imageUrlB },
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
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />

      <OptionField label="Option A" value={labelA} onChange={setLabelA} file={fileA} onFile={setFileA} />
      <OptionField label="Option B" value={labelB} onChange={setLabelB} file={fileB} onFile={setFileB} />

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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. BMW"
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
