"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { useUser } from "@clerk/nextjs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  clerkErrorMessage,
  isReverificationCancelled,
} from "@/components/auth/clerk-errors";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------- types */

export type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
export type EmailAddress = ClerkUser["emailAddresses"][number];
export type ExternalAccount = ClerkUser["externalAccounts"][number];
export type UserSession = Awaited<ReturnType<ClerkUser["getSessions"]>>[number];
export type TotpResource = Awaited<ReturnType<ClerkUser["createTOTP"]>>;

/* ---------------------------------------------------------------- styles */

const btnBase =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0";

export const btn = {
  primary: cn(
    btnBase,
    "h-11 rounded-xl bg-ink px-4 text-sm text-white hover:bg-ink-2",
  ),
  outline: cn(
    btnBase,
    "h-10 rounded-xl border border-input bg-white px-3.5 text-sm text-ink hover:bg-line-soft",
  ),
  ghost: cn(
    btnBase,
    "h-10 rounded-xl px-3.5 text-sm text-ink-2 hover:bg-line-soft hover:text-ink",
  ),
  danger: cn(
    btnBase,
    "h-11 rounded-xl bg-late px-4 text-sm text-white hover:bg-late-strong",
  ),
  small: cn(
    btnBase,
    "h-9 rounded-lg bg-paper px-3 text-[13px] text-ink hover:bg-secondary",
  ),
  icon: cn(
    btnBase,
    "size-9 rounded-lg text-muted-foreground hover:bg-line-soft hover:text-ink",
  ),
};

export const inputClass =
  "h-11 rounded-xl border-input bg-white px-3 text-[15px] md:text-[15px]";

export const dialogClass =
  "rounded-2xl border-line bg-card p-5 sm:max-w-md sm:p-6";

/* ------------------------------------------------------------ primitives */

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-4 animate-spin", className)}
      aria-hidden="true"
    />
  );
}

export function SettingsCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-6 rounded-2xl border border-line bg-card p-5 sm:p-6"
    >
      <h2 id={`${id}-title`} className="text-lg font-bold text-ink">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

export function SettingRow({
  title,
  description,
  icon,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 border-b border-line-soft py-3.5 last:border-b-0">
      {icon}
      <div className="min-w-0 flex-[1_1_220px]">
        <p className="font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(inputClass, className)} />;
}

export function CodeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label}>
      <TextInput
        id={id}
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        required
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="font-mono text-lg tracking-[0.35em] md:text-lg"
      />
    </Field>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-late-border bg-late-bg px-3.5 py-2.5 text-sm font-medium text-late-strong"
    >
      {message}
    </p>
  );
}

export function Badge({
  tone,
  children,
}: {
  tone: "ink" | "lime" | "late" | "soft";
  children: React.ReactNode;
}) {
  const tones = {
    ink: "bg-ink text-white",
    lime: "bg-lime text-ink",
    late: "bg-late-bg text-late",
    soft: "bg-lime-soft text-ink",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- helpers */

/**
 * Shows a toast for a failed Clerk call. Closing Clerk's re-auth prompt is a
 * deliberate cancel, so it stays silent. Returns the message (or null).
 */
export function reportError(err: unknown, fallback?: string): string | null {
  if (isReverificationCancelled(err)) return null;
  const message = clerkErrorMessage(err, fallback);
  toast.error(message);
  return message;
}

export function errorText(err: unknown, fallback?: string): string | null {
  if (isReverificationCancelled(err)) return null;
  return clerkErrorMessage(err, fallback);
}

export async function copyText(text: string, success = "Kopirano.") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(success);
  } catch {
    toast.error("Kopiranje nije uspjelo. Označite tekst i kopirajte ga ručno.");
  }
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/* -------------------------------------------------------- confirm dialog */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  destructive?: boolean;
  /** Resolve to true to close the dialog. */
  onConfirm: () => Promise<boolean>;
}) {
  const [pending, setPending] = React.useState(false);

  async function confirm() {
    setPending(true);
    try {
      const done = await onConfirm();
      if (done) onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <AlertDialogContent className={dialogClass}>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-bold text-ink">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 gap-2">
          <AlertDialogCancel
            disabled={pending}
            className={cn(btn.ghost, "border-0 bg-transparent shadow-none")}
          >
            Odustani
          </AlertDialogCancel>
          <button
            type="button"
            onClick={confirm}
            disabled={pending}
            className={destructive ? btn.danger : btn.primary}
          >
            {pending ? <Spinner /> : null}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
