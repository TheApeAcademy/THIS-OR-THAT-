import { BottomTabBar } from "@/components/BottomTabBar";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: "var(--safe-top)",
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
