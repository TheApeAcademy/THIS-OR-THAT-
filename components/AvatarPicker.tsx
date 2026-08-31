"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createAvatar } from "@dicebear/core";
import * as adventurer from "@dicebear/adventurer";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { updateAvatarAction } from "@/lib/actions/avatar";
import {
  BACKGROUND_COLORS,
  DEFAULT_AVATAR_CHOICE,
  EYEBROWS,
  EYES,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTHS,
  SKIN_COLORS,
  randomAvatarChoice,
  type AvatarChoice,
} from "@/lib/avatarOptions";

function buildDataUri(choice: AvatarChoice): string {
  const avatar = createAvatar(adventurer, {
    seed: choice.seed,
    skinColor: [choice.skinColor],
    hair: choice.hair ? [choice.hair] : [],
    hairProbability: choice.hair ? 100 : 0,
    hairColor: [choice.hairColor],
    eyes: [choice.eyes],
    eyebrows: [choice.eyebrows],
    mouth: [choice.mouth],
    glasses: choice.glasses ? [choice.glasses] : [],
    glassesProbability: choice.glasses ? 100 : 0,
    earrings: choice.earrings ? ["variant01"] : [],
    earringsProbability: choice.earrings ? 100 : 0,
    features: [],
    featuresProbability: 0,
    backgroundColor: [choice.backgroundColor],
    backgroundType: ["solid"],
  });
  return avatar.toDataUri();
}

function Swatch({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-transform",
        active ? "scale-105 border-accent" : "border-transparent"
      )}
    >
      {children}
    </button>
  );
}

function ColorSwatch({ hex, active, onClick }: { hex: string; active: boolean; onClick: () => void }) {
  return (
    <Swatch active={active} onClick={onClick} title={`#${hex}`}>
      <span className="block h-7 w-7 rounded-full" style={{ backgroundColor: `#${hex}` }} />
    </Swatch>
  );
}

export function AvatarPicker({
  onSaved,
  defaultOpen = false,
  hideClose = false,
}: {
  onSaved?: (avatarUrl: string) => void;
  defaultOpen?: boolean;
  hideClose?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // Start from a fixed choice so server and client render identically, then
  // roll a random starting look once we're safely past hydration.
  const [choice, setChoice] = useState<AvatarChoice>(DEFAULT_AVATAR_CHOICE);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Deliberate one-time randomize-after-mount, not state sync: this is
    // the standard fix for hydration-safe randomness (see DEFAULT_AVATAR_CHOICE).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(randomAvatarChoice());
  }, []);

  const dataUri = useMemo(() => buildDataUri(choice), [choice]);

  const set = <K extends keyof AvatarChoice>(key: K, value: AvatarChoice[K]) =>
    setChoice((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    startTransition(async () => {
      await updateAvatarAction(dataUri);
      setSaved(true);
      onSaved?.(dataUri);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Build my avatar
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-raised p-4">
      <div>
        <p className="text-sm font-semibold text-text-secondary">Build my avatar</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          A fun cartoon avatar — no Bitmoji account needed. Pick your look, or shuffle for inspiration.
        </p>
      </div>

      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUri}
          alt="Avatar preview"
          width={128}
          height={128}
          className="h-32 w-32 rounded-full border border-border"
        />
      </div>

      <Button variant="secondary" className="w-full" onClick={() => setChoice(randomAvatarChoice())}>
        🎲 Shuffle
      </Button>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Skin tone</p>
        <div className="flex gap-2">
          {SKIN_COLORS.map((hex) => (
            <ColorSwatch key={hex} hex={hex} active={choice.skinColor === hex} onClick={() => set("skinColor", hex)} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Hair</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Swatch active={choice.hair === null} onClick={() => set("hair", null)} title="No hair">
            <span className="text-xs font-semibold text-text-secondary">None</span>
          </Swatch>
          {HAIR_STYLES.map((style) => (
            <Swatch key={style} active={choice.hair === style} onClick={() => set("hair", style)} title={style}>
              <span className="text-[10px] text-text-secondary">{style.replace(/[a-z]/gi, "").padStart(2, "0")}</span>
            </Swatch>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Hair color</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {HAIR_COLORS.map((hex) => (
            <ColorSwatch key={hex} hex={hex} active={choice.hairColor === hex} onClick={() => set("hairColor", hex)} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Eyes</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {EYES.map((v, i) => (
            <Swatch key={v} active={choice.eyes === v} onClick={() => set("eyes", v)} title={v}>
              <span className="text-[10px] text-text-secondary">{i + 1}</span>
            </Swatch>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Eyebrows</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {EYEBROWS.map((v, i) => (
            <Swatch key={v} active={choice.eyebrows === v} onClick={() => set("eyebrows", v)} title={v}>
              <span className="text-[10px] text-text-secondary">{i + 1}</span>
            </Swatch>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Mouth</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MOUTHS.map((v, i) => (
            <Swatch key={v} active={choice.mouth === v} onClick={() => set("mouth", v)} title={v}>
              <span className="text-[10px] text-text-secondary">{i + 1}</span>
            </Swatch>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Glasses</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Swatch active={choice.glasses === null} onClick={() => set("glasses", null)} title="No glasses">
            <span className="text-xs font-semibold text-text-secondary">None</span>
          </Swatch>
          {GLASSES.map((v, i) => (
            <Swatch key={v} active={choice.glasses === v} onClick={() => set("glasses", v)} title={v}>
              <span className="text-[10px] text-text-secondary">{i + 1}</span>
            </Swatch>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary">Earrings</p>
        <button
          type="button"
          onClick={() => set("earrings", !choice.earrings)}
          className={clsx(
            "rounded-full px-3 py-1 text-xs font-semibold",
            choice.earrings ? "bg-accent text-accent-contrast" : "bg-surface text-text-secondary"
          )}
        >
          {choice.earrings ? "On" : "Off"}
        </button>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-text-secondary">Background</p>
        <div className="flex gap-2">
          {BACKGROUND_COLORS.map((hex) => (
            <ColorSwatch
              key={hex}
              hex={hex}
              active={choice.backgroundColor === hex}
              onClick={() => set("backgroundColor", hex)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : saved ? "Saved!" : "Save avatar"}
        </Button>
        {!hideClose && (
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}
