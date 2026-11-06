import { Suspense } from "react";
import { AppActionsProvider } from "@/components/app/AppActions";
import { CommandPalette } from "@/components/app/CommandPalette";
import { MobileHeader, MobileTabBar, Sidebar } from "@/components/app/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppActionsProvider>
      <div className="flex min-h-dvh bg-paper">
        <Suspense fallback={<div className="hidden w-[248px] lg:block" />}>
          <Sidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <main className="flex-1 px-4 pt-5 pb-28 sm:px-6 lg:px-9 lg:pt-7 lg:pb-12">
            <Suspense>{children}</Suspense>
          </main>
        </div>
      </div>
      <MobileTabBar />
      <CommandPalette />
    </AppActionsProvider>
  );
}
