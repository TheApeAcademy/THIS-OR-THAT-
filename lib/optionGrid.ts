/**
 * Column count for an N-option comparison grid (2-8 options). Returns a
 * literal Tailwind class name (not a computed one) so the build's content
 * scanner can find every class this function can produce.
 */
export function gridColsClass(count: number): string {
  if (count <= 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  if (count === 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-3";
  return "grid-cols-4";
}

/**
 * Row count + aspect ratio for the full-screen swipe feed's non-binary
 * tile grid (3-8 options — 2 is handled separately as the draggable
 * this-or-that pair). 3 keeps its existing asymmetric 2x2 layout (one
 * tall tile) rather than a plain 3-wide row.
 */
export function feedGridLayout(count: number): { colsClass: string; rowsClass: string; aspectRatio: string } {
  if (count <= 4) return { colsClass: "grid-cols-2", rowsClass: "grid-rows-2", aspectRatio: "1" };
  if (count <= 6) return { colsClass: "grid-cols-3", rowsClass: "grid-rows-2", aspectRatio: "3 / 2" };
  return { colsClass: "grid-cols-4", rowsClass: "grid-rows-2", aspectRatio: "2 / 1" };
}
