import Image from "next/image";
import Link from "next/link";
import { BottomTabBar } from "@/components/BottomTabBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationBell } from "@/components/NotificationBell";
import { CardViewListener } from "@/components/CardViewListener";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { OfflineVoteSync } from "@/components/OfflineVoteSync";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("muted_notification_types")
      .eq("id", user.id)
      .single();
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
      {user && (
        <header
          className="glass-chrome fixed inset-x-0 top-0 z-30 flex h-11 items-center justify-between border-b border-border/60 px-4"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <Link href="/home" className="tap-scale flex items-center gap-1.5">
            <Image
              src="/icons/icon-512.png"
              alt=""
              width={22}
              height={22}
              className="overflow-hidden rounded-[26%]"
            />
            <span className="text-sm font-bold tracking-tight text-text-primary">This or That</span>
          </Link>
          <NotificationBell unreadCount={unreadCount} />
        </header>
      )}
      <ScrollRestoration
        style={{
          paddingTop: user ? "calc(var(--safe-top) + 44px)" : "var(--safe-top)",
          paddingBottom: "calc(var(--safe-bottom) + 64px)",
        }}
      >
        {children}
      </ScrollRestoration>
      <InstallPrompt />
      <OfflineVoteSync />
      {user && <CardViewListener userId={user.id} />}
      <BottomTabBar />
    </div>
  );
}
