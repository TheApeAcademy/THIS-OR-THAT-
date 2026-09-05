"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { LockIcon } from "@/components/ui/icons";
import { BirthdateField } from "@/components/BirthdateField";
import { UpgradeProButton } from "@/components/UpgradeProButton";
import { updateProfileCardAction, updateBirthdateAction, type SocialLinks } from "@/lib/actions/profile";
import { updateCardThemeAction, type CardVersionRow } from "@/lib/actions/card";
import { CARD_THEMES, type CardTheme } from "@/lib/cardThemes";
import { SOCIAL_PLATFORMS } from "@/components/ui/SocialIcons";
import { SPRING_BOUNCY, SPRING_SMOOTH } from "@/lib/motion";
import { formatRelativeTime } from "@/lib/relativeTime";

const THEME_KEYS = Object.keys(CARD_THEMES) as CardTheme[];

export function EditCardForm({
  initialBio,
  initialSocialLinks,
  initialBirthdate,
  initialTheme = "blue",
  versions = [],
  isPro = false,
  userId,
  userEmail,
  onClose,
}: {
  initialBio: string;
  initialSocialLinks: SocialLinks;
  initialBirthdate?: string;
  initialTheme?: string;
  versions?: CardVersionRow[];
  isPro?: boolean;
  userId: string;
  userEmail: string;
  onClose?: () => void;
}) {
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState<SocialLinks>(initialSocialLinks);
  const [birthdate, setBirthdate] = useState(initialBirthdate ?? "");
  const [theme, setTheme] = useState<CardTheme>((initialTheme as CardTheme) ?? "blue");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, Boolean(initialSocialLinks[p.key])]))
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showHistory, setShowHistory] = useState(false);

  const toggle = (key: keyof SocialLinks, next: boolean) => {
    setEnabled((prev) => ({ ...prev, [key]: next }));
    if (!next) {
      setLinks((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const selectTheme = (next: CardTheme) => {
    if (CARD_THEMES[next].pro && !isPro) return;
    setTheme(next);
    updateCardThemeAction(next).catch(() => setTheme((initialTheme as CardTheme) ?? "blue"));
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
        <p className="pt-1 text-sm font-semibold text-text-secondary">Card theme</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_KEYS.map((key) => {
            const locked = CARD_THEMES[key].pro && !isPro;
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectTheme(key)}
                aria-label={locked ? `${CARD_THEMES[key].label} theme (TOT Pro)` : `${CARD_THEMES[key].label} theme`}
                title={locked ? `${CARD_THEMES[key].label} - requires TOT Pro` : CARD_THEMES[key].label}
                className={clsx(
                  "tap-scale relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-offset-2 ring-offset-surface",
                  theme === key && "ring-2 ring-accent",
                  locked && "opacity-70"
                )}
                style={{ background: CARD_THEMES[key].swatch }}
              >
                {locked && <LockIcon size={13} className="text-white drop-shadow" />}
              </button>
            );
          })}
        </div>
        {!isPro && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2">
            <p className="text-xs text-text-secondary">Neon, Glass and Luxury themes are TOT Pro exclusives.</p>
            <UpgradeProButton userId={userId} userEmail={userEmail} label="Upgrade" />
          </div>
        )}
      </div>

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

      {versions.length > 0 && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-sm font-semibold text-accent"
          >
            {showHistory ? "Hide" : "Show"} card history
          </button>
          <AnimatePresence initial={false}>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={SPRING_SMOOTH}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5">
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs text-text-secondary">
                      <span>Card updated · {CARD_THEMES[v.theme as CardTheme]?.label ?? v.theme} theme</span>
                      <span>{formatRelativeTime(v.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
