"use client";

import { Check, Plus } from "lucide-react";
import { useMemo } from "react";
import { Card } from "@/components/app/bits";
import { sum, type Item } from "@/lib/data";
import {
  addDays,
  dayMonth,
  formatAmount,
  formatMoney,
  plural,
  shortDate,
  toISODate,
  weekdayIndex,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

function itemTone(i: Item) {
  if (i.status === "late")
    return "border-late-border bg-late-bg text-late-strong font-semibold";
  if (i.status === "paid")
    return "border-paid-bg bg-paid-bg text-muted-foreground";
  return "border-line bg-card text-ink";
}

/**
 * Monday-first month grid: colour-toned chips on tablet/desktop, profile dots
 * on phones. Shared by the calendar page and the browser new-tab page.
 */
export function MonthGrid({
  month,
  today,
  items,
  onOpenItem,
  onAddDay,
  selectedDay = null,
  onSelectDay,
  selectedItemId = null,
  compact = false,
  fill = false,
  footer,
}: {
  /** First day of the month to show. */
  month: Date;
  today: Date;
  /** Items to place; only those due in `month` appear. */
  items: Item[];
  onOpenItem: (item: Item) => void;
  /** "+" on a day; gets the day as "2026-11-06". */
  onAddDay: (iso: string) => void;
  /** Phone: the tapped day, outlined. Without `onSelectDay` days are not tappable. */
  selectedDay?: string | null;
  onSelectDay?: (iso: string | null) => void;
  /** Outlines one instance's chip. */
  selectedItemId?: string | null;
  /** Shorter cells, for the new-tab page. */
  compact?: boolean;
  /**
   * From `lg` up, take the parent's whole height: weeks share it evenly, a
   * week with more payments grows and the grid scrolls instead of clipping.
   * The parent must be a flex column with a bounded height.
   */
  fill?: boolean;
  /** Rendered inside the card, under the grid. */
  footer?: React.ReactNode;
}) {
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const offset = weekdayIndex(month);
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const gridStart = addDays(month, -offset);

  const byDate = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of items) m.set(i.dueDate, [...(m.get(i.dueDate) ?? []), i]);
    return m;
  }, [items]);

  return (
    <Card
      className={cn(
        "overflow-hidden",
        fill && "flex flex-col lg:min-h-0 lg:flex-1",
      )}
    >
      <div className="grid shrink-0 grid-cols-7 border-b border-line bg-[#FAFAF7]">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-1.5 py-2.5 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase md:px-2.5 md:text-left"
          >
            {w}
          </div>
        ))}
      </div>
      <div
        className={cn(
          "grid grid-cols-7",
          fill &&
            "lg:min-h-0 lg:flex-1 lg:grid-rows-[repeat(var(--weeks),minmax(min-content,1fr))] lg:overflow-y-auto lg:[scrollbar-width:thin]",
        )}
        style={fill ? ({ "--weeks": weeks } as React.CSSProperties) : undefined}
      >
        {Array.from({ length: weeks * 7 }, (_, idx) => {
          const d = addDays(gridStart, idx);
          const iso = toISODate(d);
          const inMonth = d.getMonth() === month.getMonth();
          const isToday = d.getTime() === today.getTime();
          const dayItems = inMonth ? (byDate.get(iso) ?? []) : [];
          const weekend = idx % 7 >= 5;
          const selected = selectedDay === iso;
          const dayClass = cn(
            "grid h-7 min-w-7 place-items-center rounded-full px-1 text-[13px]",
            isToday ? "bg-lime font-bold" : "font-medium",
            !inMonth && "text-[#6B707A]",
            selected && "ring-2 ring-ink",
          );
          return (
            <div
              key={iso}
              className={cn(
                "group relative flex min-h-16 min-w-0 flex-col gap-1 border-r border-b border-line-soft p-1 md:p-1.5",
                compact ? "md:min-h-24" : "md:min-h-29.5",
                fill && "lg:min-h-0",
                !inMonth
                  ? "bg-[#F4F4EF]"
                  : weekend
                    ? "bg-[#FAFAF7]"
                    : "bg-card",
                (idx + 1) % 7 === 0 && "border-r-0",
              )}
            >
              <div className="flex items-center justify-between">
                {onSelectDay ? (
                  <button
                    type="button"
                    disabled={!inMonth}
                    onClick={() => onSelectDay(selected ? null : iso)}
                    aria-label={`${shortDate(d)}${dayItems.length ? `, ${dayItems.length} ${plural(dayItems.length, "uplata", "uplate", "uplata")}` : ""}`}
                    className={cn(dayClass, "md:pointer-events-none")}
                  >
                    {d.getDate()}
                  </button>
                ) : (
                  <span className={dayClass}>{d.getDate()}</span>
                )}
                {dayItems.length > 1 && (
                  <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
                    {formatAmount(sum(dayItems))}
                  </span>
                )}
                {inMonth && (
                  <button
                    type="button"
                    onClick={() => onAddDay(iso)}
                    aria-label={`Dodaj uplatu za ${dayMonth(d)}`}
                    className="absolute right-1 bottom-1 hidden size-7 place-items-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-ink focus-visible:opacity-100 md:grid"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                )}
              </div>
              {/* chips (tablet/desktop) */}
              <div className="hidden flex-col gap-1 md:flex">
                {dayItems.map((i) => (
                  <button
                    key={i._id}
                    type="button"
                    onClick={() => onOpenItem(i)}
                    title={`${i.bill.name} · ${i.profile.name} · ${formatMoney(i.amount)}`}
                    className={cn(
                      "flex min-w-0 items-center gap-1 rounded-md border border-l-[3px] px-1.5 py-1 text-left text-xs hover:brightness-[0.97]",
                      itemTone(i),
                      selectedItemId === i._id &&
                        "ring-2 ring-ink ring-offset-1",
                    )}
                    style={{ borderLeftColor: i.profile.color }}
                  >
                    {i.status === "paid" && (
                      <Check
                        className="size-3 shrink-0"
                        strokeWidth={3}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "truncate",
                        i.status === "paid" && "line-through",
                      )}
                    >
                      {i.bill.name}
                    </span>
                    <span
                      className={cn(
                        "ml-auto font-mono text-[11px]",
                        i.status === "paid" && "line-through",
                      )}
                    >
                      {formatAmount(i.amount)}
                    </span>
                  </button>
                ))}
              </div>
              {/* dots (phone) */}
              {dayItems.length > 0 && (
                <div className="flex flex-wrap gap-0.5 md:hidden" aria-hidden>
                  {dayItems.slice(0, 4).map((i) => (
                    <span
                      key={i._id}
                      className={cn(
                        "size-2 rounded-full",
                        i.status === "paid" && "opacity-35",
                      )}
                      style={{
                        backgroundColor:
                          i.status === "late" ? "#C2410C" : i.profile.color,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {footer}
    </Card>
  );
}
