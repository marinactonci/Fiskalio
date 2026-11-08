"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/Logo";
import { startOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TopBar } from "./TopBar";

/** Signed out: sign in here, then come straight back to the new-tab page. */
export function SignedOut() {
  return (
    <div className="relative mx-auto flex max-w-400 flex-col gap-4.5">
      <TopBar today={startOfDay(new Date())} />
      <div aria-hidden className="pointer-events-none opacity-55 select-none">
        <SkeletonBody />
      </div>
      <div className="absolute inset-x-0 top-14 flex justify-center px-2 sm:top-24">
        <section
          aria-labelledby="newtab-signin-title"
          className="flex w-full max-w-120 flex-col gap-4.5 rounded-[20px] border border-line bg-card p-6 shadow-[0_24px_60px_rgba(21,23,28,0.14)] sm:p-8"
        >
          <LogoMark className="size-12 rounded-[14px] [&_svg]:size-6" />
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[13px] text-muted-foreground">
              Nova kartica
            </p>
            <h1
              id="newtab-signin-title"
              className="font-display text-[32px] leading-[1.05] font-extrabold tracking-tight"
            >
              Prijavite se u Fiskalio
            </h1>
            <p className="text-[15px] leading-normal text-ink-2">
              Svaka nova kartica tada prikazuje kalendar računa i što je na
              redu. Prijavljujete se samo jednom.
            </p>
          </div>
          <Link
            href="/sign-in?redirect_url=%2Fnewtab"
            className={cn(buttonVariants({ size: "lg" }), "font-bold")}
          >
            Prijavi se
          </Link>
          <p className="border-t border-line-soft pt-3.5 text-xs leading-normal text-muted-foreground">
            Nemate račun?{" "}
            <Link
              href="/sign-up?redirect_url=%2Fnewtab"
              className="font-semibold text-ink hover:underline"
            >
              Registrirajte se
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

/** Loading: the page's shape without data. */
export function NewTabSkeleton() {
  return (
    <div
      className="mx-auto flex max-w-400 flex-col gap-4.5"
      aria-busy="true"
      aria-label="Učitavanje"
    >
      <TopBar />
      <div className="animate-pulse">
        <SkeletonBody />
      </div>
    </div>
  );
}

// Which of the 35 placeholder cells get a chip-shaped bar, and how wide (%).
const BARS: Record<number, number> = {
  1: 82,
  3: 64,
  8: 90,
  9: 70,
  11: 76,
  15: 68,
  18: 84,
  23: 74,
  29: 80,
  32: 66,
};

function SkeletonBody() {
  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5">
        <div className="flex h-11 items-center gap-3">
          <span className="h-7.5 w-55 rounded-[10px] bg-secondary" />
          <span className="size-10 rounded-xl bg-secondary" />
          <span className="size-10 rounded-xl bg-secondary" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="h-9 border-b border-line bg-[#FAFAF7]" />
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "flex min-h-16 flex-col gap-1.5 border-r border-b border-line-soft p-1.5 md:min-h-24",
                  i % 7 >= 5 ? "bg-[#FAFAF7]" : "bg-card",
                  i % 7 === 6 && "border-r-0",
                  i >= 28 && "border-b-0",
                )}
              >
                <span className="h-3.5 w-5.5 rounded-md bg-line-soft" />
                {BARS[i] && (
                  <span
                    className="h-5.5 rounded-lg bg-line-soft"
                    style={{ width: `${BARS[i]}%` }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
        <div className="h-37.5 rounded-2xl bg-secondary" />
        <div className="h-105 rounded-2xl border border-line bg-card" />
      </div>
    </div>
  );
}
