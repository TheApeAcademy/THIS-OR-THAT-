"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createAvatar } from "@dicebear/core";
import * as adventurer from "@dicebear/adventurer";
import * as avataaars from "@dicebear/avataaars";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { updateAvatarAction } from "@/lib/actions/avatar";
import {
  AVATAR_STYLES,
  buildStyledAvatarUri,
  randomSeed,
  type AvatarStyleKey,
} from "@/lib/avatarStyles";
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
import {
  ACCESSORIES,
  ACCESSORIES_COLORS,
  CLOTHES_COLORS,
  CLOTHING,
  CLOTHING_GRAPHICS,
  DEFAULT_AVATAAARS_CHOICE,
  EYEBROWS as AA_EYEBROWS,
  EYES as AA_EYES,
  FACIAL_HAIR,
  FACIAL_HAIR_COLORS,
  HAIR_COLORS as AA_HAIR_COLORS,
  HAT_COLORS,
  HEADWEAR_TOPS,
  MOUTHS as AA_MOUTHS,
  SKIN_COLORS as AA_SKIN_COLORS,
  TOPS,
  randomAvataaarsChoice,
  type AvataaarsChoice,
} from "@/lib/avataaarsOptions";

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

function buildAvataaarsDataUri(choice: AvataaarsChoice): string {
  const avatar = createAvatar(avataaars, {
    seed: choice.seed,
    skinColor: [choice.skinColor],
    top: choice.top ? [choice.top] : [],
    topProbability: choice.top ? 100 : 0,
    hairColor: [choice.hairColor],
    hatColor: [choice.hatColor],
    eyebrows: [choice.eyebrows],
    eyes: [choice.eyes],
    mouth: [choice.mouth],
    facialHair: choice.facialHair ? [choice.facialHair] : [],
    facialHairProbability: choice.facialHair ? 100 : 0,
    facialHairColor: [choice.facialHairColor],
    accessories: choice.accessories ? [choice.accessories] : [],
    accessoriesProbability: choice.accessories ? 100 : 0,
    accessoriesColor: [choice.accessoriesColor],
    clothing: [choice.clothing],
    clothingGraphic: choice.clothingGraphic ? [choice.clothingGraphic] : [],
    clothesColor: [choice.clothesColor],
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

const DEFAULT_SEED = "default";

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
  const [styleKey, setStyleKey] = useState<AvatarStyleKey>("adventurer");

  // Start from fixed, non-random state so server and client render
  // identically, then roll random starting looks once we're safely past
  // hydration (see DEFAULT_AVATAR_CHOICE / DEFAULT_SEED).
  const [choice, setChoice] = useState<AvatarChoice>(DEFAULT_AVATAR_CHOICE);
  const [aaChoice, setAaChoice] = useState<AvataaarsChoice>(DEFAULT_AVATAAARS_CHOICE);
  const [otherSeed, setOtherSeed] = useState(DEFAULT_SEED);
  const [otherBackground, setOtherBackground] = useState(BACKGROUND_COLORS[0]);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Deliberate one-time randomize-after-mount, not state sync: this is
    // the standard fix for hydration-safe randomness.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(randomAvatarChoice());
    setAaChoice(randomAvataaarsChoice());
    setOtherSeed(randomSeed());
  }, []);

  const dataUri = useMemo(() => {
    if (styleKey === "adventurer") return buildDataUri(choice);
    if (styleKey === "avataaars") return buildAvataaarsDataUri(aaChoice);
    return buildStyledAvatarUri(styleKey, otherSeed, otherBackground);
  }, [styleKey, choice, aaChoice, otherSeed, otherBackground]);

  const set = <K extends keyof AvatarChoice>(key: K, value: AvatarChoice[K]) =>
    setChoice((prev) => ({ ...prev, [key]: value }));

  const setAa = <K extends keyof AvataaarsChoice>(key: K, value: AvataaarsChoice[K]) =>
    setAaChoice((prev) => ({ ...prev, [key]: value }));

  const shuffle = () => {
    if (styleKey === "adventurer") {
      setChoice(randomAvatarChoice());
    } else if (styleKey === "avataaars") {
      setAaChoice(randomAvataaarsChoice());
    } else {
      setOtherSeed(randomSeed());
    }
  };

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

  const activeStyle = AVATAR_STYLES.find((s) => s.key === styleKey)!;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-raised p-4">
      <div>
        <p className="text-sm font-semibold text-text-secondary">Build my avatar</p>
        <p className="mt-0.5 text-xs text-text-secondary">
          A fun avatar — no Bitmoji account needed. Pick a style, then your look, or shuffle for inspiration.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {AVATAR_STYLES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStyleKey(s.key)}
            className={clsx(
              "tap-scale shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold",
              styleKey === s.key ? "accent-gradient text-white" : "glass text-text-secondary"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="-mt-2 text-[11px] text-text-secondary">{activeStyle.description}</p>

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

      <Button variant="secondary" className="w-full" onClick={shuffle}>
        🎲 Shuffle
      </Button>

      {styleKey === "adventurer" ? (
        <>
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
        </>
      ) : styleKey === "avataaars" ? (
        <>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Skin tone</p>
            <div className="flex gap-2">
              {AA_SKIN_COLORS.map((hex) => (
                <ColorSwatch key={hex} hex={hex} active={aaChoice.skinColor === hex} onClick={() => setAa("skinColor", hex)} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Hair &amp; headwear</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Swatch active={aaChoice.top === null} onClick={() => setAa("top", null)} title="Bald / none">
                <span className="text-xs font-semibold text-text-secondary">None</span>
              </Swatch>
              {TOPS.map((v, i) => (
                <Swatch key={v} active={aaChoice.top === v} onClick={() => setAa("top", v)} title={v}>
                  <span className="text-[10px] text-text-secondary">{i + 1}</span>
                </Swatch>
              ))}
            </div>
          </div>

          {aaChoice.top && HEADWEAR_TOPS.includes(aaChoice.top) ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-text-secondary">Hat color</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {HAT_COLORS.map((hex) => (
                  <ColorSwatch key={hex} hex={hex} active={aaChoice.hatColor === hex} onClick={() => setAa("hatColor", hex)} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-text-secondary">Hair color</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AA_HAIR_COLORS.map((hex) => (
                  <ColorSwatch key={hex} hex={hex} active={aaChoice.hairColor === hex} onClick={() => setAa("hairColor", hex)} />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Eyes</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {AA_EYES.map((v, i) => (
                <Swatch key={v} active={aaChoice.eyes === v} onClick={() => setAa("eyes", v)} title={v}>
                  <span className="text-[10px] text-text-secondary">{i + 1}</span>
                </Swatch>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Eyebrows</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {AA_EYEBROWS.map((v, i) => (
                <Swatch key={v} active={aaChoice.eyebrows === v} onClick={() => setAa("eyebrows", v)} title={v}>
                  <span className="text-[10px] text-text-secondary">{i + 1}</span>
                </Swatch>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Mouth</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {AA_MOUTHS.map((v, i) => (
                <Swatch key={v} active={aaChoice.mouth === v} onClick={() => setAa("mouth", v)} title={v}>
                  <span className="text-[10px] text-text-secondary">{i + 1}</span>
                </Swatch>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Facial hair</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Swatch active={aaChoice.facialHair === null} onClick={() => setAa("facialHair", null)} title="No facial hair">
                <span className="text-xs font-semibold text-text-secondary">None</span>
              </Swatch>
              {FACIAL_HAIR.map((v, i) => (
                <Swatch key={v} active={aaChoice.facialHair === v} onClick={() => setAa("facialHair", v)} title={v}>
                  <span className="text-[10px] text-text-secondary">{i + 1}</span>
                </Swatch>
              ))}
            </div>
          </div>

          {aaChoice.facialHair && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-text-secondary">Facial hair color</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {FACIAL_HAIR_COLORS.map((hex) => (
                  <ColorSwatch
                    key={hex}
                    hex={hex}
                    active={aaChoice.facialHairColor === hex}
                    onClick={() => setAa("facialHairColor", hex)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Glasses</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Swatch active={aaChoice.accessories === null} onClick={() => setAa("accessories", null)} title="No glasses">
                <span className="text-xs font-semibold text-text-secondary">None</span>
              </Swatch>
              {ACCESSORIES.map((v, i) => (
                <Swatch key={v} active={aaChoice.accessories === v} onClick={() => setAa("accessories", v)} title={v}>
                  <span className="text-[10px] text-text-secondary">{i + 1}</span>
                </Swatch>
              ))}
            </div>
          </div>

          {aaChoice.accessories && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-text-secondary">Glasses color</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {ACCESSORIES_COLORS.map((hex) => (
                  <ColorSwatch
                    key={hex}
                    hex={hex}
                    active={aaChoice.accessoriesColor === hex}
                    onClick={() => setAa("accessoriesColor", hex)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Clothing</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CLOTHING.map((v, i) => (
                <Swatch key={v} active={aaChoice.clothing === v} onClick={() => setAa("clothing", v)} title={v}>
                  <span className="text-[10px] text-text-secondary">{i + 1}</span>
                </Swatch>
              ))}
            </div>
          </div>

          {aaChoice.clothing === "graphicShirt" && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-text-secondary">Shirt graphic</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CLOTHING_GRAPHICS.map((v, i) => (
                  <Swatch key={v} active={aaChoice.clothingGraphic === v} onClick={() => setAa("clothingGraphic", v)} title={v}>
                    <span className="text-[10px] text-text-secondary">{i + 1}</span>
                  </Swatch>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Clothes color</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CLOTHES_COLORS.map((hex) => (
                <ColorSwatch key={hex} hex={hex} active={aaChoice.clothesColor === hex} onClick={() => setAa("clothesColor", hex)} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">Background</p>
            <div className="flex gap-2">
              {BACKGROUND_COLORS.map((hex) => (
                <ColorSwatch
                  key={hex}
                  hex={hex}
                  active={aaChoice.backgroundColor === hex}
                  onClick={() => setAa("backgroundColor", hex)}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-text-secondary">Background</p>
          <div className="flex gap-2">
            {BACKGROUND_COLORS.map((hex) => (
              <ColorSwatch key={hex} hex={hex} active={otherBackground === hex} onClick={() => setOtherBackground(hex)} />
            ))}
          </div>
        </div>
      )}

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
