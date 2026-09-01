import { Avatar } from "@/components/ui/Avatar";

export function CardBlocked({
  username,
  reason = "blocked",
}: {
  username: string;
  reason?: "blocked" | "followers-only";
}) {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-4 px-8 text-center"
      style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
    >
      <Avatar name={username} src={null} size={72} className="opacity-40 grayscale" />
      <p className="text-lg font-bold text-text-primary">This card isn&apos;t available to you</p>
      <p className="text-sm text-text-secondary">
        {reason === "followers-only"
          ? `@${username} only shares this card with followers. Follow them to see it.`
          : `@${username} has restricted access to this specific card.`}
      </p>
    </div>
  );
}
