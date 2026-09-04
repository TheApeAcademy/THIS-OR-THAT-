export type NotificationType = "follow" | "comment" | "reply" | "comment_like" | "mention";

export interface NotificationActor {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface RawNotificationRow {
  id: string;
  type: string;
  comparison_id: string | null;
  comment_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: { id: string; username: string; avatar_url: string | null } | null;
}

export interface NotificationGroup {
  key: string;
  type: NotificationType;
  actors: NotificationActor[];
  totalActors: number;
  comparisonId: string | null;
  createdAt: string;
  unread: boolean;
}

/**
 * Collapses a chronological list of notification rows into feed-style groups —
 * "Alice, Bob and 4 others followed you" instead of six separate rows. Rows
 * for the same event target (the same follow relationship bucket, the same
 * liked comment, the same commented-on comparison) merge into one group,
 * keyed on the most specific target available.
 */
export function groupNotifications(rows: RawNotificationRow[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();
  const seenActorsByKey = new Map<string, Set<string>>();
  const order: string[] = [];

  for (const row of rows) {
    if (!row.actor || !isNotificationType(row.type)) continue;

    const target =
      row.type === "follow"
        ? "follow"
        : row.type === "comment_like" || row.type === "mention"
          ? row.comment_id
          : row.comparison_id;
    const key = `${row.type}:${target ?? row.id}`;

    let group = groups.get(key);
    let seenActors = seenActorsByKey.get(key);
    if (!group || !seenActors) {
      group = {
        key,
        type: row.type,
        actors: [],
        totalActors: 0,
        comparisonId: row.comparison_id,
        createdAt: row.created_at,
        unread: false,
      };
      seenActors = new Set();
      groups.set(key, group);
      seenActorsByKey.set(key, seenActors);
      order.push(key);
    }

    if (!row.read_at) group.unread = true;

    if (!seenActors.has(row.actor.id)) {
      seenActors.add(row.actor.id);
      group.totalActors += 1;
      if (group.actors.length < 2) {
        group.actors.push({ id: row.actor.id, username: row.actor.username, avatarUrl: row.actor.avatar_url });
      }
    }
  }

  return order.map((key) => groups.get(key)!);
}

function isNotificationType(value: string): value is NotificationType {
  return (
    value === "follow" ||
    value === "comment" ||
    value === "reply" ||
    value === "comment_like" ||
    value === "mention"
  );
}

const VERBS: Record<NotificationType, string> = {
  follow: "started following you",
  comment: "commented on your debate",
  reply: "replied to your comment",
  comment_like: "liked your comment",
  mention: "mentioned you in a comment",
};

export function notificationMessage(group: NotificationGroup): string {
  const names = group.actors.map((a) => `@${a.username}`);
  const extra = group.totalActors - names.length;

  const who =
    extra > 0
      ? `${names.join(", ")} and ${extra} other${extra === 1 ? "" : "s"}`
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : names[0];

  return `${who} ${VERBS[group.type]}`;
}
