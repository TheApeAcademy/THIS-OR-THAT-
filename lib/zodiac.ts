// Pure zodiac-sign lookup from a birthdate. Nothing is ever stored derived
// from this - same "derive at render time" pattern as lib/archetype.ts.
export function getZodiacSign(birthdate: string | Date | null | undefined): { name: string; symbol: string } | null {
  if (!birthdate) return null;
  const d = typeof birthdate === "string" ? new Date(birthdate) : birthdate;
  if (Number.isNaN(d.getTime())) return null;
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const md = month * 100 + day;

  if (md >= 1222 || md <= 119) return { name: "Capricorn", symbol: "♑" };
  if (md <= 218) return { name: "Aquarius", symbol: "♒" };
  if (md <= 320) return { name: "Pisces", symbol: "♓" };
  if (md <= 419) return { name: "Aries", symbol: "♈" };
  if (md <= 520) return { name: "Taurus", symbol: "♉" };
  if (md <= 620) return { name: "Gemini", symbol: "♊" };
  if (md <= 722) return { name: "Cancer", symbol: "♋" };
  if (md <= 822) return { name: "Leo", symbol: "♌" };
  if (md <= 922) return { name: "Virgo", symbol: "♍" };
  if (md <= 1022) return { name: "Libra", symbol: "♎" };
  if (md <= 1121) return { name: "Scorpio", symbol: "♏" };
  return { name: "Sagittarius", symbol: "♐" };
}
