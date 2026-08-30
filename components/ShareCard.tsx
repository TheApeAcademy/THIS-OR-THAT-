import { Avatar } from "@/components/ui/Avatar";
import { DnaBreakdown, type DnaRow } from "@/components/DnaBreakdown";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { CompareForm } from "@/components/CompareForm";

interface ShareCardProps {
  username: string;
  avatarUrl: string | null;
  aiSummary: string | null;
  rows: DnaRow[];
  shareSlug: string;
  viewerUsername?: string | null;
}

export function ShareCard({
  username,
  avatarUrl,
  aiSummary,
  rows,
  shareSlug,
  viewerUsername = null,
}: ShareCardProps) {
  return (
    <div
      className="mx-auto flex min-h-[100dvh] max-w-md flex-col gap-6 px-4 py-8"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div className="rounded-xl border border-border bg-surface-raised p-6 shadow-md">
        <div className="flex items-center gap-4">
          <Avatar name={username} src={avatarUrl} size={56} />
          <div>
            <p className="text-xl font-bold text-text-primary">@{username}</p>
            <p className="text-sm text-text-secondary">This or That</p>
          </div>
        </div>

        {aiSummary && <p className="mt-4 text-sm leading-relaxed text-text-primary">{aiSummary}</p>}

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-text-secondary">Preference DNA</p>
          <DnaBreakdown rows={rows} />
        </div>
      </div>

      <CopyLinkButton path={`/card/${shareSlug}`} />
      <CompareForm withUsername={username} viewerUsername={viewerUsername} />
    </div>
  );
}
