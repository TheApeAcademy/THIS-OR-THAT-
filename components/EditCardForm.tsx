"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { updateProfileCardAction, type SocialLinks } from "@/lib/actions/profile";
import { updateCardThemeAction } from "@/lib/actions/card";
import { SOCIAL_PLATFORMS } from "@/components/ui/SocialIcons";
import { CARD_THEMES, type CardThemeKey } from "@/lib/cardThemes";

export function EditCardForm({
  initialBio,
  initialSocialLinks,
  initialTheme = "blue",
}: {
  initialBio: string;
  initialSocialLinks: SocialLinks;
  initialTheme?: string;
}) {
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<SocialLinks>(initialSocialLinks);
  const [theme, setTheme] = useState(initialTheme);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, Boolean(initialSocialLinks[p.key])]))
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const pickTheme = (key: CardThemeKey) => {
    const previous = theme;
    setTheme(key);
    startTransition(() => {
      updateCardThemeAction(key).catch(() => setTheme(previous));
    });
  };

  const toggle = (key: keyof SocialLinks, next: boolean) => {
    setEnabled((prev) => ({ ...prev, [key]: next }));
    if (!next) {
      setLinks((prev) => ({ ...prev, [key]: "" }));
    }
  };

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
        Card settings
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

      <div>
        <p className="text-sm font-semibold text-text-secondary">Card theme</p>
        <div className="mt-2 flex gap-2">
          {(Object.entries(CARD_THEMES) as [CardThemeKey, (typeof CARD_THEMES)[CardThemeKey]][]).map(
            ([key, t]) => (
              <button
                key={key}
                type="button"
                aria-label={t.label}
                onClick={() => pickTheme(key)}
                className="tap-scale h-9 w-9 shrink-0 rounded-full"
                style={{
                  background: t.gradient,
                  outline: theme === key ? "2px solid var(--accent)" : "none",
                  outlineOffset: 2,
                }}
              />
            )
          )}
        </div>
      </div>

      <div>
        <p className="pt-1 text-sm font-semibold text-text-secondary">Social links</p>
        <p className="text-xs text-text-secondary">
          Toggle an app on, then paste the link from its share/profile button — we&apos;ll show a nice icon
          on your card that opens it.
        </p>
      </div>

      <div className="space-y-2">
        {SOCIAL_PLATFORMS.map((p) => (
          <div key={p.key} className="rounded-lg border border-border">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary">
                <p.icon size={15} />
              </span>
              <span className="flex-1 text-sm font-medium text-text-primary">{p.label}</span>
              <Toggle checked={!!enabled[p.key]} onChange={(next) => toggle(p.key, next)} label={p.label} />
            </div>
            {enabled[p.key] && (
              <div className="px-3 pb-2.5">
                <input
                  value={links[p.key] ?? ""}
                  onChange={(e) => setLinks((prev) => ({ ...prev, [p.key]: e.target.value }))}
                  placeholder={`Paste your ${p.label} link`}
                  autoFocus
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>

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
