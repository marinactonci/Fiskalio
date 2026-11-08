"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Card,
  EstimatedChip,
  PaidToggle,
  ProfileDot,
} from "@/components/app/bits";
import {
  groupByDueMonth,
  groupOpenItems,
  openItems,
  sum,
  type Item,
  type Model,
} from "@/lib/data";
import {
  formatMoney,
  plural,
  relativeDue,
  shortDate,
  toMonthKey,
} from "@/lib/format";
import { cn } from "@/lib/utils";

/** "Na redu" from the dashboard, compact: late, this week, next week; later and paid fold away. */
export function OpenList({
  model,
  today,
  selectedId,
  onOpen,
}: {
  model: Model;
  today: Date;
  selectedId: string | null;
  onOpen: (item: Item) => void;
}) {
  const [laterOpen, setLaterOpen] = useState(false);
  const [paidOpen, setPaidOpen] = useState(false);
  const groups = groupOpenItems(openItems(model.items, today), today);
  const monthKey = toMonthKey(today);
  const paidThisMonth = model.items.filter(
    (i) => i.dueMonth === monthKey && i.status === "paid",
  );

  const rows = (items: Item[]) => (
    <ul>
      {items.map((i) => (
        <Row
          key={i._id}
          item={i}
          today={today}
          selected={i._id === selectedId}
          onOpen={onOpen}
        />
      ))}
    </ul>
  );

  return (
    <Card
      aria-labelledby="newtab-open-title"
      className="flex flex-col overflow-hidden lg:min-h-40 lg:flex-1"
    >
      <div className="flex shrink-0 items-center justify-between gap-2.5 border-b border-line-soft px-4.5 py-3.5">
        <h2 id="newtab-open-title" className="text-[17px] font-bold">
          Na redu
        </h2>
        <Link
          href="/dashboard"
          className="text-[13px] font-semibold hover:underline"
        >
          Pregled →
        </Link>
      </div>

      {/* Desktop: the list scrolls here when the column runs out of height. */}
      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-width:thin]">
        {groups.length === 0 && (
          <p className="px-4.5 py-4 text-sm text-ink-2">
            Sve je plaćeno. Nove uplate otvorit će se 1. u mjesecu.
          </p>
        )}

        {groups.map((g) =>
          g.key === "later" ? (
            <Fold
              key={g.key}
              title={g.title}
              count={g.items.length}
              amount={sum(g.items)}
              open={laterOpen}
              onToggle={() => setLaterOpen((o) => !o)}
            >
              {rows(g.items)}
            </Fold>
          ) : (
            <div key={g.key} className="pb-1">
              <div className="flex items-baseline justify-between gap-2 px-4.5 pt-3 pb-1.5">
                <h3
                  className={cn(
                    "text-xs font-bold tracking-wider uppercase",
                    g.tone === "late" ? "text-late" : "text-ink",
                  )}
                >
                  {g.title}
                </h3>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatMoney(sum(g.items))}
                </span>
              </div>
              {g.tone === "late" &&
              new Set(g.items.map((i) => i.dueMonth)).size > 1
                ? groupByDueMonth(g.items).map((m) => (
                    <div key={m.key}>
                      <p className="px-4.5 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground capitalize">
                        {m.label}
                      </p>
                      {rows(m.items)}
                    </div>
                  ))
                : rows(g.items)}
            </div>
          ),
        )}

        {paidThisMonth.length > 0 && (
          <Fold
            title="Plaćeno ovaj mjesec"
            tone="muted"
            count={paidThisMonth.length}
            amount={sum(paidThisMonth)}
            open={paidOpen}
            onToggle={() => setPaidOpen((o) => !o)}
          >
            {rows(paidThisMonth)}
          </Fold>
        )}
      </div>
    </Card>
  );
}

function Fold({
  title,
  tone,
  count,
  amount,
  open,
  onToggle,
  children,
}: {
  title: string;
  tone?: "muted";
  count: number;
  amount: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line-soft">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4.5 py-3 text-left hover:bg-[#FAFAF7]"
      >
        <span
          className={cn(
            "text-xs font-bold tracking-wider uppercase",
            tone === "muted" ? "text-ink-2" : "text-ink",
          )}
        >
          {title}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs whitespace-nowrap text-muted-foreground">
          {count} {plural(count, "uplata", "uplate", "uplata")} ·{" "}
          {formatMoney(amount)}
          <ChevronDown
            className={cn("size-3.5 transition", !open && "-rotate-90")}
            aria-hidden
          />
        </span>
      </button>
      {open && children}
    </div>
  );
}

function Row({
  item: i,
  today,
  selected,
  onOpen,
}: {
  item: Item;
  today: Date;
  selected: boolean;
  onOpen: (item: Item) => void;
}) {
  const paid = i.status === "paid";
  return (
    <li
      className={cn(
        "flex items-center gap-3 border-t border-paper py-0.5 pr-4.5 pl-4 hover:bg-[#FAFAF7]",
        selected && "shadow-[inset_3px_0_0_var(--ink)]",
      )}
    >
      <PaidToggle item={i} size="sm" />
      <button
        type="button"
        onClick={() => onOpen(i)}
        aria-current={selected || undefined}
        className="flex min-w-0 flex-1 flex-col gap-0.5 py-2 text-left"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "truncate text-sm font-semibold",
              paid && "line-through",
            )}
          >
            {i.bill.name}
          </span>
          {i.isEstimated && !paid && (
            <span className="shrink-0">
              <EstimatedChip />
            </span>
          )}
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <ProfileDot color={i.profile.color} className="size-1.75" />
          <span className="truncate">{i.profile.name}</span>
        </span>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            "font-mono text-sm font-semibold",
            paid && "text-muted-foreground line-through",
          )}
        >
          {formatMoney(i.amount)}
        </span>
        <span
          className={cn(
            "text-xs",
            i.status === "late"
              ? "font-semibold text-late"
              : "text-muted-foreground",
          )}
        >
          {shortDate(i.due)}
          {!paid && ` · ${relativeDue(i.due, today)}`}
        </span>
      </div>
    </li>
  );
}
