"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { DataSection } from "./DataSection";
import { ProfileSection } from "./ProfileSection";
import { SecuritySection } from "./SecuritySection";
import { Spinner, btn } from "./shared";

export function AccountSettings() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      setSigningOut(false);
    }
  }

  return (
    // The app shell's <main> provides the page padding.
    <div className="flex w-full max-w-3xl flex-col gap-5">
      <header>
        <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-tight text-ink sm:text-[38px]">
          Postavke računa
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Vaši podaci, prijava i izvoz. Profili kućanstava uređuju se pod
          Računi.
        </p>
      </header>

      {!isLoaded ? (
        <div
          role="status"
          aria-label="Učitavanje postavki"
          className="flex flex-col gap-5"
        >
          {[220, 300, 180].map((h) => (
            <div
              key={h}
              className="animate-pulse rounded-2xl border border-line bg-card"
              style={{ height: h }}
            />
          ))}
        </div>
      ) : user ? (
        <>
          <ProfileSection user={user} />
          <SecuritySection user={user} />
          <DataSection user={user} />
          <div>
            <button
              type="button"
              className={btn.ghost}
              onClick={onSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <Spinner />
              ) : (
                <LogOut className="size-4" aria-hidden="true" />
              )}
              Odjava
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
