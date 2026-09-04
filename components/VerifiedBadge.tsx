export function VerifiedBadge({ type }: { type: "identity" | "social" }) {
  return (
    <span
      title={type === "identity" ? "Verified identity" : "Verified social accounts"}
      aria-label={type === "identity" ? "Verified identity" : "Verified social accounts"}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] text-white"
    >
      ✓
    </span>
  );
}
