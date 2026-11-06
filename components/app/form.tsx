"use client";

import { cn } from "@/lib/utils";

/** Small shared form primitives for the app dialogs. */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-late" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export const textareaClass =
  "min-h-20 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** "48,60" / "48.60" / "1.234,50" → 48.6; NaN when not a number. */
export function parseAmountInput(s: string): number {
  const t = s.trim().replace(/\s|€/g, "");
  if (!t) return Number.NaN;
  // "1.234,50" → "1234.50"; "48,60" → "48.60"
  const normalized = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  return /^-?\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : Number.NaN;
}

export function amountToInput(n: number): string {
  return n.toFixed(2).replace(".", ",");
}
