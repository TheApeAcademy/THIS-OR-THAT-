"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createGroupAction } from "@/lib/actions/groups";

export function CreateGroupForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        + Start a group
      </Button>
    );
  }

  const submit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const slug = await createGroupAction(name, description || null);
      router.push(`/groups/${slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-raised p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name, e.g. Wizkid FC"
        maxLength={60}
        className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-text-primary outline-none focus:border-accent"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's this group about? (optional)"
        maxLength={300}
        rows={2}
        className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={submit} disabled={!name.trim() || isSubmitting}>
          {isSubmitting ? "Creating…" : "Create"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
