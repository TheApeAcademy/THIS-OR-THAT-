import { BottomTabBar } from "@/components/BottomTabBar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineVoteSync } from "@/components/OfflineVoteSync";
import { ScrollRestoration } from "@/components/ScrollRestoration";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <ScrollRestoration>{children}</ScrollRestoration>
      <InstallPrompt />
      <OfflineVoteSync />
      <BottomTabBar />
    </div>
  );
}
