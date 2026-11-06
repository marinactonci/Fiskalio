"use client";

import { useMutation } from "convex/react";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { InstanceStatus, Item } from "@/lib/data";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="font-mono text-[13px] text-muted-foreground">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-[32px] leading-[1.05] font-extrabold tracking-tight sm:text-[38px]">
          {title}
        </h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("rounded-2xl border border-line bg-card", className)} {...rest}>
      {children}
    </section>
  );
}

export function ProfileDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

const STATUS_STYLE: Record<InstanceStatus, { label: string; cls: string }> = {
  paid: { label: "Plaćeno", cls: "bg-paid-bg text-ink-2" },
  late: { label: "Kasni", cls: "bg-late-bg text-late" },
  due: { label: "Čeka", cls: "bg-paper text-ink" },
};

export function StatusPill({ status, className }: { status: InstanceStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", s.cls, className)}>
      {s.label}
    </span>
  );
}

export function EstimatedChip() {
  return (
    <span
      className="rounded-full border border-dashed border-[#A9ACA0] px-2 text-[11px] font-semibold text-muted-foreground"
      title="Iznos je prepisan iz prošlog mjeseca"
    >
      procjena
    </span>
  );
}

export function EBillLink({ href, name, className }: { href?: string; name: string; className?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Otvori portal za e-račun: ${name}`}
      title="Portal za e-račun"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg border border-line text-muted-foreground hover:border-ink-2 hover:text-ink",
        className,
      )}
    >
      <ExternalLink className="size-4" aria-hidden />
    </a>
  );
}

/** Round "mark as paid" toggle with undo. */
export function PaidToggle({ item, size = "md" }: { item: Item; size?: "sm" | "md" }) {
  const setPaid = useMutation(api.billInstances.setPaid);
  const paid = item.isPaid;
  const toggle = async () => {
    const res = await setPaid({ id: item._id, isPaid: !paid });
    if (!res.success) {
      toast.error(res.error || "Promjena nije uspjela.");
      return;
    }
    toast.success(paid ? `${item.bill.name}: vraćeno na neplaćeno` : `${item.bill.name} je plaćen`, {
      action: { label: "Poništi", onClick: () => void setPaid({ id: item._id, isPaid: paid }) },
    });
  };
  const dim = size === "sm" ? "size-[22px]" : "size-[26px]";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paid}
      aria-label={paid ? `Označi neplaćeno: ${item.bill.name}` : `Označi plaćeno: ${item.bill.name}`}
      className="-m-2 grid size-11 shrink-0 place-items-center rounded-full"
    >
      <span
        className={cn(
          "grid place-items-center rounded-full border-2 transition",
          dim,
          paid
            ? "border-ink bg-ink text-lime"
            : item.status === "late"
              ? "border-[#C2410C] bg-card hover:bg-late-bg"
              : "border-[#A9ACA0] bg-card hover:border-ink",
        )}
      >
        {paid && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      </span>
    </button>
  );
}

export function LoadingState() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Učitavanje">
      <div className="h-10 w-56 animate-pulse rounded-xl bg-line-soft" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-line-soft" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-line-soft" />
    </div>
  );
}

export function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-2xl border border-late-border bg-late-bg p-6 text-late">
      <p className="font-semibold">Podaci se nisu učitali.</p>
      <p className="mt-1 text-sm">{error}</p>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-input bg-card p-8">
      <p className="font-display text-2xl font-bold tracking-tight">{title}</p>
      {children && <div className="max-w-lg text-ink-2">{children}</div>}
      {action}
    </div>
  );
}
