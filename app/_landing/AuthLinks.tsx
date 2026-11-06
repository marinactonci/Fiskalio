"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { focusRing } from "./shared";

const headerButton = cn(
  "rounded-[10px] py-2.5 text-sm font-semibold transition-colors sm:py-[11px] sm:text-[15px]",
  focusRing,
);
const headerInkButton = cn(
  headerButton,
  "bg-ink px-3 text-white hover:bg-ink-2 sm:px-[18px]",
);

/**
 * Right side of the landing header. Until Clerk has loaded (or when signed
 * out) it shows the sign-in / sign-up pair.
 */
export function HeaderAuthButtons() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <Link href="/dashboard" className={headerInkButton}>
        Otvori aplikaciju
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2.5">
      <Link
        href="/sign-in"
        className={cn(
          headerButton,
          "px-2 text-ink hover:bg-ink/5 hover:text-ink-2 sm:px-4",
        )}
      >
        Prijava
      </Link>
      <Link href="/sign-up" className={headerInkButton}>
        Registracija
      </Link>
    </div>
  );
}

/** Primary CTA: sign-up for visitors, straight into the app when signed in. */
export function StartLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isSignedIn } = useAuth();

  return (
    <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className={className}>
      {children}
    </Link>
  );
}
