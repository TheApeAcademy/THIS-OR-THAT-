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
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, profile_photo_url")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? "";
    avatarUrl = profile?.profile_photo_url ?? profile?.avatar_url ?? null;
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
      <BottomTabBar />
    </div>
  );
}
