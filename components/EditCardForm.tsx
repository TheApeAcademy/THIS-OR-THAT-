"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { updateProfileCardAction, type SocialLinks } from "@/lib/actions/profile";

const FIELDS: { key: keyof SocialLinks; placeholder: string }[] = [
  { key: "instagram", placeholder: "Instagram handle" },
  { key: "tiktok", placeholder: "TikTok handle" },
  { key: "twitter", placeholder: "X / Twitter handle" },
  { key: "snapchat", placeholder: "Snapchat username" },
  { key: "website", placeholder: "Website (yoursite.com)" },
];

export function EditCardForm({
  initialBio,
  initialSocialLinks,
}: {
  initialBio: string;
  initialSocialLinks: SocialLinks;
}) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<SocialLinks>(initialSocialLinks);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      await updateProfileCardAction(bio, links);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Edit my card
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4">
      <p className="text-sm font-semibold text-text-secondary">Card bio</p>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={160}
        rows={2}
        placeholder="A short line about you (shown on your card)"
        className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />

      <p className="pt-1 text-sm font-semibold text-text-secondary">Social links</p>
      {FIELDS.map((f) => (
        <input
          key={f.key}
          value={links[f.key] ?? ""}
          onChange={(e) => setLinks((prev) => ({ ...prev, [f.key]: e.target.value }))}
          placeholder={f.placeholder}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
      ))}

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : saved ? "Saved!" : "Save"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  );
}
