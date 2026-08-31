import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { PLAY_SUBJECTS } from "@/lib/playFeed";
import { generateQrDataUrl } from "@/lib/qr";

export const dynamic = "force-dynamic";

interface RankResult {
  rank_position: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  correct: number;
  total: number;
}

const getRankData = cache(async (username: string, subject: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, profile_photo_url, display_name")
    .eq("username", username)
    .single();
  if (!profile) return null;

  const p_subject = subject === "all" ? null : subject;
  const { data: rows } = await supabase.rpc("get_user_rank", {
    p_user_id: profile.id,
    p_subject: p_subject ?? undefined,
  });
  const result = (rows?.[0] as RankResult | undefined) ?? null;
  return { profile, subject: p_subject, result };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; subject: string }>;
}): Promise<Metadata> {
  const { username, subject } = await params;
  const data = await getRankData(username, subject);
  if (!data) return { title: "Rank · This or That" };

  const subjectMeta = PLAY_SUBJECTS.find((s) => s.slug === data.subject);
  const subjectLabel = data.subject ? subjectMeta?.label ?? data.subject : "Overall";
  const title = data.result
    ? `@${username} is #${data.result.rank_position} in ${subjectLabel} trivia · This or That`
    : `@${username}'s ${subjectLabel} trivia rank · This or That`;
  const description = data.result
    ? `${data.result.correct}/${data.result.total} correct — see the full leaderboard on This or That.`
    : `@${username} hasn't played ${subjectLabel} trivia yet.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/rank/${username}/${subject}`,
      images: [`/rank/${username}/${subject}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/rank/${username}/${subject}/opengraph-image`],
    },
  };
}

export default async function RankPage({
  params,
}: {
  params: Promise<{ username: string; subject: string }>;
}) {
  const { username, subject } = await params;
  const data = await getRankData(username, subject);
  if (!data) notFound();

  const hdrs = await headers();
  const host = hdrs.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const shareUrl = host ? `${protocol}://${host}/rank/${username}/${subject}` : null;
  const qrDataUrl = shareUrl ? await generateQrDataUrl(shareUrl) : null;
  const subjectMeta = PLAY_SUBJECTS.find((s) => s.slug === data.subject);

  return (
    <div
      className="mx-auto max-w-md space-y-6 px-4 py-8"
      style={{ paddingTop: "calc(var(--safe-top) + 24px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
    >
      <div className="flex flex-col items-center gap-2">
        <Avatar
          name={data.profile.username}
          src={data.profile.profile_photo_url ?? data.profile.avatar_url}
          size={64}
        />
        <p className="text-lg font-semibold text-text-primary">@{data.profile.username}</p>
        <p className="text-sm text-text-secondary">
          {subjectMeta ? `${subjectMeta.emoji} ${subjectMeta.label}` : "Overall"} Trivia
        </p>
      </div>

      {data.result ? (
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-center shadow-sm">
          <p className="text-5xl font-bold text-accent">#{data.result.rank_position}</p>
          <p className="mt-1 text-sm text-text-secondary">
            {data.result.correct}/{data.result.total} correct
          </p>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-text-secondary">No rank yet — play a few rounds first.</p>
      )}

      {qrDataUrl && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code to this rank" width={160} height={160} />
        </div>
      )}
    </div>
  );
}
