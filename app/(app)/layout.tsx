import { BottomTabBar } from "@/components/BottomTabBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { NotificationBell } from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unreadCount = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null);
    unreadCount = count ?? 0;
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {user && (
        <header
          className="glass fixed inset-x-0 top-0 z-30 flex h-11 items-center justify-end px-4"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <NotificationBell unreadCount={unreadCount} />
        </header>
      )}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: user ? "calc(var(--safe-top) + 44px)" : "var(--safe-top)",
          paddingBottom: "calc(var(--safe-bottom) + 64px)",
        }}
      >
        {children}
      </main>
      <InstallPrompt />
      <BottomTabBar />
    </div>
  );
}
