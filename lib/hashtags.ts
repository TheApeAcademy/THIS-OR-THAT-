const HASHTAG_RE = /#([a-zA-Z][a-zA-Z0-9_]{1,29})/g;
const MAX_HASHTAGS = 5;

/** Pulls up to 5 distinct #tags out of free text, lowercased, no leading #. */
export function parseHashtags(text: string | null | undefined): string[] {
  if (!text) return [];

  const seen = new Set<string>();
  for (const match of text.matchAll(HASHTAG_RE)) {
    seen.add(match[1].toLowerCase());
    if (seen.size >= MAX_HASHTAGS) break;
  }
  return [...seen];
}
