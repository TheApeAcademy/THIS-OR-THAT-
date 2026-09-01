// Per-tile grid span for a comparison's option tiles, keyed by how many
// options there are. Each count gets a deliberate, fixed Pinterest-style
// layout (one "hero" tile plus smaller ones) rather than a uniform grid —
// every pattern below fits inside a single square-ish 2-column container,
// so nothing ever needs to overflow or scroll.
export function tileSpanClass(count: number, index: number): string | undefined {
  if (count === 3) {
    return index === 0 ? "row-span-2" : undefined;
  }
  if (count === 5) {
    return index === 0 ? "col-span-2" : undefined;
  }
  if (count === 6) {
    return index === 0 || index === 5 ? "col-span-2" : undefined;
  }
  return undefined;
}

// Row/column shape for the option grid, given the option count. Each shape
// is chosen so the span pattern above tiles exactly — no leftover empty
// cells at any option count.
export function tileGridClass(count: number): string {
  if (count === 6) return "grid-cols-2 grid-rows-4";
  if (count === 5) return "grid-cols-2 grid-rows-3";
  if (count === 3 || count === 4) return "grid-cols-2 grid-rows-2";
  return "grid-cols-2";
}
