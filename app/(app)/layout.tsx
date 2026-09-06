import { BottomTabBar } from "@/components/BottomTabBar";
import { AppHeader } from "@/components/AppHeader";
import { InstallPrompt } from "@/components/InstallPrompt";
import { CardViewListener } from "@/components/CardViewListener";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { SwipeBackGate } from "@/components/SwipeBackGate";
import { OfflineVoteSync } from "@/components/OfflineVoteSync";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let username = "";
  let unreadCount = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, profile_photo_url, muted_notification_types")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? "";
    avatarUrl = profile?.profile_photo_url ?? profile?.avatar_url ?? null;

    const mutedTypes = profile?.muted_notification_types ?? [];
    let unreadQuery = supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    if (mutedTypes.length) unreadQuery = unreadQuery.not("type", "in", `(${mutedTypes.join(",")})`);
    const { count } = await unreadQuery;
    unreadCount = count ?? 0;
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {user && <AppHeader avatarUrl={avatarUrl} username={username} />}
      <SwipeBackGate>
        <ScrollRestoration
          style={{
            paddingTop: user ? "calc(var(--safe-top) + 44px)" : "var(--safe-top)",
            paddingBottom: "calc(var(--safe-bottom) + 64px)",
          }}
        >
          {children}
        </ScrollRestoration>
      </SwipeBackGate>
      <InstallPrompt />
      <OfflineVoteSync />
      {user && <CardViewListener userId={user.id} />}
      <BottomTabBar unreadCount={unreadCount} />
    </div>
  );
}
