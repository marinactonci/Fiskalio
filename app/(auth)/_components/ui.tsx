"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { cn } from "@/lib/utils";

export const authInputClass =
  "h-12 rounded-xl border-input bg-white px-3.5 text-[15px] md:text-[15px]";

export function AuthHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink sm:text-[40px]">
        {title}
      </h1>
      {children ? (
        <p className="mt-2.5 text-[15px] text-muted-foreground">{children}</p>
      ) : null}
    </div>
  );
}

/** Keeps `?redirect_url=…` when switching between sign-in and sign-up. */
function useCarriedSearch() {
  const params = useSearchParams();
  const redirect = params.get("redirect_url");
  return redirect ? `?redirect_url=${encodeURIComponent(redirect)}` : "";
}

export function AuthTabs() {
  const pathname = usePathname();
  const search = useCarriedSearch();
  const tabs = [
    { href: "/sign-in", label: "Prijava" },
    { href: "/sign-up", label: "Registracija" },
  ];

  return (
    <nav
      aria-label="Prijava ili registracija"
      className="mt-7 grid grid-cols-2 rounded-xl bg-secondary p-1"
    >
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={`${tab.href}${search}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg py-2.5 text-center text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "bg-white text-ink shadow-[0_1px_2px_rgba(21,23,28,0.08)]"
                : "text-muted-foreground hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AuthSwitchLink({
  to,
  children,
}: {
  to: "/sign-in" | "/sign-up";
  children: React.ReactNode;
}) {
  const search = useCarriedSearch();
  return (
    <Link
      href={`${to}${search}`}
      className="font-semibold text-ink underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

export function GoogleButton({
  onClick,
  pending,
  disabled,
}: {
  onClick: () => void;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className="mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-input bg-white text-[15px] font-semibold text-ink outline-none transition-colors hover:bg-line-soft focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
      ) : (
        <GoogleIcon />
      )}
      Nastavi s Googleom
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-[22px] flex items-center gap-3 text-[13px] text-muted-foreground">
      <span className="h-px flex-1 bg-input" aria-hidden="true" />
      ili e-poštom
      <span className="h-px flex-1 bg-input" aria-hidden="true" />
    </div>
  );
}

export function AuthField({
  id,
  label,
  hint,
  aside,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function AuthInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(authInputClass, className)} />;
}

export function FormError({
  id,
  message,
}: {
  id?: string;
  message: string | null;
}) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="rounded-xl border border-late-border bg-late-bg px-3.5 py-2.5 text-sm font-medium text-late-strong"
    >
      {message}
    </p>
  );
}

export function SubmitButton({
  pending,
  pendingLabel,
  disabled,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="mt-1.5 flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink text-base font-semibold text-white outline-none transition-colors hover:bg-ink-2 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function TextButton({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "cursor-pointer rounded-sm font-medium text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    />
  );
}
