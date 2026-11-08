"use client";

import { ClerkFailed, ClerkLoaded, ClerkLoading, useAuth } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/app/bits";
import { useModel } from "@/hooks/use-model";
import { NewTabView } from "./_components/NewTabView";
import { NewTabSkeleton, SignedOut } from "./_components/SignedOut";

/** How long a signed-in user may wait for Convex to accept the session before we say so. */
const CONVEX_AUTH_TIMEOUT_MS = 15_000;

export default function NewTabPage() {
  // The middleware skips this route, so the server always renders "signed out".
  // Wait for clerk-js to read the real session before showing anything.
  return (
    <>
      <ClerkLoading>
        <NewTabSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <NewTabContent />
      </ClerkLoaded>
      <ClerkFailed>
        <Problem>
          Prijava trenutno nije dostupna. Provjerite vezu ili blokiranje
          sadržaja u pregledniku.
        </Problem>
      </ClerkFailed>
    </>
  );
}

function NewTabContent() {
  // Clerk decides signed in/out; Convex then needs a moment to accept the
  // token. Until it does, `useConvexAuth` says "not authenticated", which must
  // not be mistaken for signed out.
  const { isSignedIn } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const signedOut = isSignedIn === false;
  const waitingForConvex = !!isSignedIn && !isAuthenticated;
  const [slow, setSlow] = useState(false);
  useReloadWhenStale(signedOut);

  useEffect(() => {
    if (!waitingForConvex) return;
    const timer = window.setTimeout(
      () => setSlow(true),
      CONVEX_AUTH_TIMEOUT_MS,
    );
    return () => {
      window.clearTimeout(timer);
      setSlow(false);
    };
  }, [waitingForConvex]);

  if (signedOut) return <SignedOut />;
  if (waitingForConvex) {
    return slow ? (
      <Problem>Podaci se ne učitavaju. Pokušajte ponovno za trenutak.</Problem>
    ) : (
      <NewTabSkeleton />
    );
  }
  if (!isAuthenticated) return <NewTabSkeleton />;
  return <SignedIn />;
}

function SignedIn() {
  const state = useModel();
  if (state.status === "loading") return <NewTabSkeleton />;
  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-400">
        <ErrorState error={state.error} />
      </div>
    );
  }
  return <NewTabView model={state.model} />;
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto flex max-w-120 flex-col items-start gap-3.5 pt-24"
      role="alert"
    >
      <p className="font-display text-2xl font-bold tracking-tight">
        Fiskalio se ne učitava
      </p>
      <p className="text-ink-2">{children}</p>
      <div className="flex flex-wrap gap-2.5">
        <Button onClick={() => window.location.reload()}>
          Pokušaj ponovno
        </Button>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline" })}
        >
          Otvori Fiskalio
        </Link>
      </div>
    </div>
  );
}

/** True while the user is typing or has a panel or dialog open: never reload then. */
function busyEditing(): boolean {
  if (
    document.querySelector(
      '[role="dialog"], [role="alertdialog"], [data-newtab-panel]',
    )
  )
    return true;
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  );
}

/**
 * A new tab can stay open for days. "Late" and "today" are computed when the
 * data loads, so reload once the date has changed (not mid-edit; the next
 * check retries). Signed out, reload when the tab comes back: the user may
 * have just signed in in another tab.
 */
function useReloadWhenStale(signedOut: boolean) {
  useEffect(() => {
    const openedOn = new Date().toDateString();
    const check = () => {
      if (document.visibilityState !== "visible" || busyEditing()) return;
      if (new Date().toDateString() !== openedOn) window.location.reload();
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (signedOut) window.location.reload();
      else check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(check, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, [signedOut]);
}
