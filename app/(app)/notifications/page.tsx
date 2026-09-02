import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { formatRelativeTime } from "@/lib/relativeTime";
import { MarkAllReadButton } from "@/components/MarkAllReadButton";

export const dynamic = "force-dynamic";

type NotificationType =
  | "like_comparison"
  | "like_card"
  | "comment_comparison"
  | "comment_card"
  | "reply_comment"
  | "follow"
  | "mention"
  | "card_view"
  | "debate_result"
  | "duel_challenge_received"
  | "duel_challenge_accepted"
  | "duel_challenge_declined";
type EntityType = "comparison" | "card" | "comment" | "card_comment" | "duel_challenge" | null;

interface NotificationRow {
  id: string;
  type: NotificationType;
  entity_type: EntityType;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: { username: string; avatar_url: string | null; profile_photo_url: string | null } | null;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("muted_notification_types")
    .eq("id", user.id)
    .single();
  const mutedTypes = profile?.muted_notification_types ?? [];

  let query = supabase
    .from("notifications")
    .select(
      "id, type, entity_type, entity_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(username, avatar_url, profile_photo_url)"
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (mutedTypes.length) query = query.not("type", "in", `(${mutedTypes.join(",")})`);
  const { data: rows } = await query.returns<NotificationRow[]>();

  const list = rows ?? [];

  const cardIds = [...new Set(list.filter((n) => n.entity_type === "card" && n.entity_id).map((n) => n.entity_id!))];
  const commentIds = [
    ...new Set(list.filter((n) => n.entity_type === "comment" && n.entity_id).map((n) => n.entity_id!)),
  ];
  const cardCommentIds = [
    ...new Set(list.filter((n) => n.entity_type === "card_comment" && n.entity_id).map((n) => n.entity_id!)),
  ];

  const [{ data: cardRows }, { data: commentRows }, { data: cardCommentRows }] = await Promise.all([
    cardIds.length
      ? supabase.from("cards").select("id, share_slug").in("id", cardIds)
      : Promise.resolve({ data: [] as { id: string; share_slug: string }[] }),
    commentIds.length
      ? supabase.from("comments").select("id, comparison_id").in("id", commentIds)
      : Promise.resolve({ data: [] as { id: string; comparison_id: string }[] }),
    cardCommentIds.length
      ? supabase
          .from("card_comments")
          .select("id, cards(share_slug)")
          .in("id", cardCommentIds)
          .returns<{ id: string; cards: { share_slug: string } | null }[]>()
      : Promise.resolve({ data: [] as { id: string; cards: { share_slug: string } | null }[] }),
  ]);

  const cardSlugById = new Map((cardRows ?? []).map((c) => [c.id, c.share_slug]));
  const comparisonIdByCommentId = new Map((commentRows ?? []).map((c) => [c.id, c.comparison_id]));
  const cardSlugByCardCommentId = new Map((cardCommentRows ?? []).map((c) => [c.id, c.cards?.share_slug ?? null]));

  function linkFor(n: NotificationRow): string | null {
    if (n.entity_type === "comparison" && n.entity_id) return `/comparison/${n.entity_id}`;
    if (n.entity_type === "card" && n.entity_id) {
      const slug = cardSlugById.get(n.entity_id);
      return slug ? `/card/${slug}` : null;
    }
    if (n.entity_type === "comment" && n.entity_id) {
      const cid = comparisonIdByCommentId.get(n.entity_id);
      return cid ? `/comparison/${cid}` : null;
    }
    if (n.entity_type === "card_comment" && n.entity_id) {
      const slug = cardSlugByCardCommentId.get(n.entity_id);
      return slug ? `/card/${slug}` : null;
    }
    if (n.entity_type === "duel_challenge") return "/duels";
    return null;
  }

  function textFor(n: NotificationRow): string {
    const who = `@${n.actor?.username ?? "someone"}`;
    switch (n.type) {
      case "like_comparison":
        return `${who} liked your comparison`;
      case "like_card":
        return `${who} liked your card`;
      case "comment_comparison":
        return `${who} commented on your comparison`;
      case "comment_card":
        return `${who} commented on your card`;
      case "reply_comment":
        return `${who} replied to your comment`;
      case "follow":
        return `${who} started following you`;
      case "mention":
        return `${who} mentioned you in a comment`;
      case "card_view":
        return `${who} viewed your card`;
      case "debate_result":
        return "The results are in on a debate you voted on";
      case "duel_challenge_received":
        return `${who} challenged you to a duel`;
      case "duel_challenge_accepted":
        return `${who} accepted your duel challenge`;
      case "duel_challenge_declined":
        return `${who} declined your duel challenge`;
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        {list.some((n) => !n.read_at) && <MarkAllReadButton />}
      </div>

      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">No notifications yet.</p>
      ) : (
        <div className="space-y-1">
          {list.map((n) => {
            const href = linkFor(n);
            const row = (
              <div className={clsx("flex items-center gap-3 rounded-xl px-3 py-3", !n.read_at && "bg-surface")}>
                <Avatar
                  name={n.actor?.username ?? "?"}
                  src={n.actor?.profile_photo_url ?? n.actor?.avatar_url ?? null}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary">{textFor(n)}</p>
                  <p className="text-xs text-text-secondary">{formatRelativeTime(n.created_at)}</p>
                </div>
              </div>
            );
            return href ? (
              <Link key={n.id} href={href}>
                {row}
              </Link>
            ) : (
              <div key={n.id}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
