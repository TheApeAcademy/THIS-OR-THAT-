import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import {
  groupNotifications,
  notificationMessage,
  type NotificationGroup,
  type RawNotificationRow,
} from "@/lib/notifications";
import { markAllNotificationsReadAction } from "@/lib/actions/notifications";
import { getRecentlyViewedAction } from "@/lib/actions/recentlyViewed";
import { ActivityTabs } from "@/components/ActivityTabs";
import { timeAgo } from "@/lib/timeAgo";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: me }, { data: rows }, recentlyViewed] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase
      .from("notifications")
      .select(
        "id, type, comparison_id, comment_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url)"
      )
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .returns<RawNotificationRow[]>(),
    getRecentlyViewedAction(),
  ]);

  const groups = groupNotifications(rows ?? []);

  // Opening Activity is what "reads" it — clear the badge now that the
  // (still correctly unread-highlighted) list above has been computed.
  await markAllNotificationsReadAction();

  const notifications =
    groups.length === 0 ? (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-lg font-semibold text-text-primary">Nothing yet</p>
        <p className="text-sm text-text-secondary">
          Follows, comments and replies will show up here.
        </p>
      </div>
    ) : (
      <div className="space-y-1">
        {groups.map((group) => (
          <NotificationRow key={group.key} group={group} myUsername={me?.username ?? ""} />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-md px-4 py-4">
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Activity</h1>
      <ActivityTabs notifications={notifications} recentlyViewed={recentlyViewed} />
    </div>
  );
}

function NotificationRow({ group, myUsername }: { group: NotificationGroup; myUsername: string }) {
  const primary = group.actors[0];
  if (!primary) return null;

  const href =
    group.type === "follow"
      ? myUsername
        ? `/compare/${primary.username}/${myUsername}`
        : "/discover"
      : group.comparisonId
        ? `/comparison/${group.comparisonId}`
        : "/home";

  return (
    <Link
      href={href}
      className={clsx(
        "tap-scale flex items-center gap-3 rounded-xl px-3 py-3",
        group.unread && "bg-accent/10"
      )}
    >
      <Avatar name={primary.username} src={primary.avatarUrl} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-text-primary">
          {notificationMessage(group)}
        </p>
        <p className="text-xs text-text-secondary">{timeAgo(group.createdAt)}</p>
      </div>
      {group.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
    </Link>
  );
}
