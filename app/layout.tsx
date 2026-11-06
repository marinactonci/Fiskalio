import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Fiskalio",
  description:
    "Svi računi kućanstva na jednom mjestu: automatske mjesečne uplate, kalendar dospijeća i statistika troškova.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body>
        <ClerkProvider
          dynamic
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          afterSignOutUrl="/"
        >
          <ConvexClientProvider>
            {children}
            <Toaster position="bottom-right" />
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
