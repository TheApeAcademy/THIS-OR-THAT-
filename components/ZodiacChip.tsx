import { getZodiacSign } from "@/lib/zodiac";

export function ZodiacChip({ birthdate, className }: { birthdate: string | null; className?: string }) {
  const sign = getZodiacSign(birthdate);
  if (!sign) return null;
  return (
    <span
      className={
        className ??
        "inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white"
      }
    >
      <span>{sign.symbol}</span>
      {sign.name}
    </span>
  );
}
