"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { BirthdateField } from "@/components/BirthdateField";
import { updateProfileCardAction, updateBirthdateAction, type SocialLinks } from "@/lib/actions/profile";
import { SOCIAL_PLATFORMS } from "@/components/ui/SocialIcons";
import { SPRING_BOUNCY, SPRING_SMOOTH } from "@/lib/motion";

export function EditCardForm({
  initialBio,
  initialSocialLinks,
  initialBirthdate,
  onClose,
}: {
  initialBio: string;
  initialSocialLinks: SocialLinks;
  initialBirthdate?: string;
  onClose?: () => void;
}) {
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<SocialLinks>(initialSocialLinks);
  const [birthdate, setBirthdate] = useState(initialBirthdate ?? "");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, Boolean(initialSocialLinks[p.key])]))
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggle = (key: keyof SocialLinks, next: boolean) => {
    setEnabled((prev) => ({ ...prev, [key]: next }));
    if (!next) {
      setLinks((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const save = () => {
    startTransition(async () => {
      await Promise.all([
        updateProfileCardAction(bio, links),
        birthdate !== (initialBirthdate ?? "") ? updateBirthdateAction(birthdate) : Promise.resolve(),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text-secondary">Card bio</p>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={160}
        rows={2}
        placeholder="A short line about you (shown on your card)"
        className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />

      <BirthdateField value={birthdate} onChange={setBirthdate} />

      <div>
        <p className="pt-1 text-sm font-semibold text-text-secondary">Social links</p>
        <p className="text-xs text-text-secondary">
          Toggle an app on, then paste the link from its share/profile button - we&apos;ll show a nice icon
          on your card that opens it.
        </p>
      </div>

      <div className="space-y-2">
        {SOCIAL_PLATFORMS.map((p) => (
          <div key={p.key} className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary">
                <p.icon size={15} />
              </span>
              <span className="flex-1 text-sm font-medium text-text-primary">{p.label}</span>
              <Toggle checked={!!enabled[p.key]} onChange={(next) => toggle(p.key, next)} label={p.label} />
            </div>
            <AnimatePresence initial={false}>
              {enabled[p.key] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRING_SMOOTH}
                >
                  <div className="px-3 pb-2.5">
                    <input
                      value={links[p.key] ?? ""}
                      onChange={(e) => setLinks((prev) => ({ ...prev, [p.key]: e.target.value }))}
                      placeholder={`Paste your ${p.label} link`}
                      autoFocus
                      className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={save} disabled={isPending}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isPending ? "saving" : saved ? "saved" : "save"}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              transition={SPRING_BOUNCY}
              className="inline-block"
            >
              {isPending ? "Saving…" : saved ? "Saved!" : "Save"}
            </motion.span>
          </AnimatePresence>
        </Button>
        <Button variant="secondary" onClick={() => onClose?.()}>
          Close
        </Button>
      </div>
    </div>
  );
}
