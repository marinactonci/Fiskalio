import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Prijava u tijeku – Fiskalio",
};

export default function SsoCallbackPage() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 text-center text-muted-foreground"
    >
      <Loader2 className="size-6 animate-spin text-ink" aria-hidden="true" />
      <p className="text-[15px] font-medium">Prijava u tijeku…</p>

      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        secondFactorUrl="/sign-in?korak=provjera"
        continueSignUpUrl="/sign-up"
      />
      {/* A Google sign-in that turns into a sign-up runs bot protection here. */}
      <div id="clerk-captcha" />
    </div>
  );
}
