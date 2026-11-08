import type { Metadata } from "next";
import { AppActionsProvider } from "@/components/app/AppActions";

export const metadata: Metadata = {
  title: "Nova kartica · Fiskalio",
  robots: { index: false, follow: false },
};

/**
 * Opened by the Fiskalio browser extension (extension/) on every new tab:
 * the calendar and what's due, without the app's sidebar.
 */
export default function NewTabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppActionsProvider>
      {/* Desktop: exactly one screen, no page scroll; the calendar and "Na redu" scroll inside. */}
      <main className="min-h-dvh bg-paper px-4 pt-4 pb-8 sm:px-6 lg:h-dvh lg:px-7 lg:pb-5">
        {children}
      </main>
    </AppActionsProvider>
  );
}
