"use client";

import { useMemo, useState, useTransition } from "react";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { Button } from "@/components/ui/Button";
import { saveDicebearAvatarAction } from "@/lib/actions/avatar";

const TOP = [
  "shortFlat", "shortWaved", "shortRound", "shortCurly", "straight01", "straight02",
  "curly", "curvy", "dreads01", "fro", "bun", "bob", "miaWallace", "hat", "turban",
] as const;
const CLOTHING = [
  "blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie",
  "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck",
] as const;
const EYES = [
  "default", "happy", "wink", "winkWacky", "surprised", "squint", "side", "closed",
  "hearts", "eyeRoll", "xDizzy",
] as const;
const EYEBROWS = [
  "defaultNatural", "raisedExcitedNatural", "sadConcernedNatural", "angryNatural",
  "flatNatural", "upDownNatural", "frownNatural", "unibrowNatural",
] as const;
const MOUTH = [
  "smile", "default", "twinkle", "serious", "concerned", "disbelief", "grimace",
  "screamOpen", "sad", "tongue",
] as const;
const FACIAL_HAIR = ["none", "beardLight", "beardMedium", "beardMajestic", "moustacheFancy", "moustacheMagnum"] as const;
const ACCESSORIES = ["none", "round", "prescription01", "prescription02", "sunglasses", "wayfarers", "kurt", "eyepatch"] as const;

// DiceBear's own default avataaars swatches - kept in sync so results
// look intentional rather than arbitrary.
const SKIN_COLORS = ["614335", "d08b5b", "ae5d29", "edb98a", "ffdbb4", "fd9841", "f8d25c"];
const HAIR_COLORS = ["a55728", "2c1b18", "b58143", "d6b370", "724133", "4a312c", "f59797", "ecdcbf", "c93305", "e8e1e1"];
const CLOTHES_COLORS = [
  "262e33", "65c9ff", "5199e4", "25557c", "e6e6e6", "929598", "3c4f5c", "b1e2ff",
  "a7ffc4", "ffafb9", "ffffb1", "ff488e", "ff5c5c", "ffffff",
];

export interface DicebearChoice {
  top: (typeof TOP)[number];
  clothing: (typeof CLOTHING)[number];
  eyes: (typeof EYES)[number];
  eyebrows: (typeof EYEBROWS)[number];
  mouth: (typeof MOUTH)[number];
  facialHair: (typeof FACIAL_HAIR)[number];
  accessories: (typeof ACCESSORIES)[number];
  skinColor: string;
  hairColor: string;
  clothesColor: string;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomChoice(): DicebearChoice {
  return {
    top: pick(TOP),
    clothing: pick(CLOTHING),
    eyes: pick(EYES),
    eyebrows: pick(EYEBROWS),
    mouth: pick(MOUTH),
    facialHair: "none",
    accessories: "none",
    skinColor: pick(SKIN_COLORS),
    hairColor: pick(HAIR_COLORS),
    clothesColor: pick(CLOTHES_COLORS),
  };
}

function toAvatarUri(choice: DicebearChoice): string {
  return createAvatar(avataaars, {
    seed: "tot",
    top: [choice.top],
    clothing: [choice.clothing],
    eyes: [choice.eyes],
    eyebrows: [choice.eyebrows],
    mouth: [choice.mouth],
    facialHair: choice.facialHair === "none" ? [] : [choice.facialHair],
    facialHairProbability: choice.facialHair === "none" ? 0 : 100,
    accessories: choice.accessories === "none" ? [] : [choice.accessories],
    accessoriesProbability: choice.accessories === "none" ? 0 : 100,
    skinColor: [choice.skinColor],
    hairColor: [choice.hairColor],
    clothesColor: [choice.clothesColor],
  }).toDataUri();
}

const containerClassName: Record<"sheet" | "inline" | "fullscreen", string> = {
  fullscreen: "flex h-full w-full flex-col overflow-y-auto p-4",
  sheet: "flex max-h-[70vh] w-full flex-col overflow-y-auto rounded-lg p-4",
  inline: "flex w-full flex-col rounded-xl border border-border p-4",
};

function CyclerRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const idx = options.indexOf(value);
  const step = (dir: 1 | -1) => {
    const next = (idx + dir + options.length) % options.length;
    onChange(options[next]);
  };
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step(-1)}
          className="tap-scale flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-primary"
          aria-label={`Previous ${label}`}
        >
          ‹
        </button>
        <span className="w-20 text-center text-xs text-text-secondary">{value}</span>
        <button
          type="button"
          onClick={() => step(1)}
          className="tap-scale flex h-8 w-8 items-center justify-center rounded-full bg-surface text-text-primary"
          aria-label={`Next ${label}`}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="py-2">
      <p className="mb-1.5 text-sm font-medium text-text-secondary">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            aria-label={`${label} ${hex}`}
            className="tap-scale h-7 w-7 rounded-full border-2"
            style={{ background: `#${hex}`, borderColor: value === hex ? "var(--accent)" : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

export function DicebearAvatarBuilder({
  variant,
  initialOptions,
  onSaved,
}: {
  variant: "sheet" | "inline" | "fullscreen";
  initialOptions?: Partial<DicebearChoice> | null;
  onSaved: (avatarUrl: string) => void;
}) {
  const [choice, setChoice] = useState<DicebearChoice>(() => ({ ...randomChoice(), ...(initialOptions ?? {}) }));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dataUri = useMemo(() => toAvatarUri(choice), [choice]);

  const set =
    <K extends keyof DicebearChoice>(key: K) =>
    (value: string) =>
      setChoice((c) => ({ ...c, [key]: value }));

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await saveDicebearAvatarAction(dataUri, choice as unknown as Record<string, string>);
        onSaved(dataUri);
      } catch {
        setError("Couldn't save your avatar - try again.");
      }
    });
  };

  return (
    <div className={containerClassName[variant]}>
      <div className="mb-4 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} alt="Your avatar" width={128} height={128} className="h-32 w-32 rounded-full bg-surface" />
      </div>

      <div className="flex-1 divide-y divide-border overflow-y-auto">
        <CyclerRow label="Hair / hat" options={TOP} value={choice.top} onChange={set("top")} />
        <CyclerRow label="Outfit" options={CLOTHING} value={choice.clothing} onChange={set("clothing")} />
        <CyclerRow label="Eyes" options={EYES} value={choice.eyes} onChange={set("eyes")} />
        <CyclerRow label="Eyebrows" options={EYEBROWS} value={choice.eyebrows} onChange={set("eyebrows")} />
        <CyclerRow label="Mouth" options={MOUTH} value={choice.mouth} onChange={set("mouth")} />
        <CyclerRow label="Facial hair" options={FACIAL_HAIR} value={choice.facialHair} onChange={set("facialHair")} />
        <CyclerRow label="Glasses" options={ACCESSORIES} value={choice.accessories} onChange={set("accessories")} />
        <ColorRow label="Skin tone" options={SKIN_COLORS} value={choice.skinColor} onChange={set("skinColor")} />
        <ColorRow label="Hair color" options={HAIR_COLORS} value={choice.hairColor} onChange={set("hairColor")} />
        <ColorRow label="Outfit color" options={CLOTHES_COLORS} value={choice.clothesColor} onChange={set("clothesColor")} />
      </div>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => setChoice(randomChoice())} disabled={isPending}>
          Shuffle
        </Button>
        <Button className="flex-1" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save avatar"}
        </Button>
      </div>
    </div>
  );
}
