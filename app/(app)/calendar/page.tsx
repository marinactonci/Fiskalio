"use client";

import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppActions } from "@/components/app/AppActions";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusPill,
} from "@/components/app/bits";
import { FilterBar } from "@/components/app/FilterBar";
import { useFilters } from "@/hooks/use-filters";
import { useModel } from "@/hooks/use-model";
import {
  applyFilters,
  byProfile,
  inScope,
  sum,
  totals,
  type Item,
  type Model,
} from "@/lib/data";
import {
  addDays,
  addMonths,
  dayMonth,
  formatAmount,
  formatMoney,
  formatPercent,
  monthLabel,
  monthTitle,
  parseMonthKey,
  plural,
  shortDate,
  toISODate,
  toMonthKey,
  weekdayIndex,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

export default function CalendarPage() {
  const state = useModel();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState error={state.error} />;
  return <CalendarView model={state.model} />;
}

function itemTone(i: Item) {
  if (i.status === "late")
    return "border-late-border bg-late-bg text-late-strong font-semibold";
  if (i.status === "paid") return "border-paid-bg bg-paid-bg text-muted-foreground";
  return "border-line bg-card text-ink";
}

function CalendarView({ model }: { model: Model }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters } = useFilters();
  const { openInstance, openProfile } = useAppActions();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const today = model.today;
  const month = parseMonthKey(params.get("m")) ?? new Date(today.getFullYear(), today.getMonth(), 1);
  const monthKey = toMonthKey(month);
  const prevMonth = addMonths(month, -1);
  const view = params.get("view") === "list" ? "list" : "month";

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const goMonth = (d: Date) => {
    setSelectedDay(null);
    const isCurrent = toMonthKey(d) === toMonthKey(today);
    setParam("m", isCurrent ? null : toMonthKey(d));
  };

  const monthItems = useMemo(
    () => model.items.filter((i) => i.dueMonth === monthKey),
    [model.items, monthKey],
  );
  const visible = useMemo(() => applyFilters(monthItems, filters), [monthItems, filters]);

  // Grid geometry (Monday-first).
  const first = month;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = weekdayIndex(first);
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const gridStart = addDays(first, -offset);

  const byDate = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of visible) {
      const k = i.dueDate;
      m.set(k, [...(m.get(k) ?? []), i]);
    }
    return m;
  }, [visible]);

  const t = totals(visible);
  const scopeNow = sum(monthItems.filter((i) => inScope(i, filters)));
  const scopePrev = sum(
    model.items.filter((i) => i.dueMonth === toMonthKey(prevMonth) && inScope(i, filters)),
  );

  const weekSums = Array.from({ length: weeks }, (_, w) => {
    const start = addDays(gridStart, w * 7);
    const days = Array.from({ length: 7 }, (_, d) => addDays(start, d)).filter(
      (d) => d.getMonth() === month.getMonth(),
    );
    const v = sum(visible.filter((i) => days.some((d) => toISODate(d) === i.dueDate)));
    const label =
      days.length === 1
        ? `${days[0].getDate()}.`
        : `${days[0].getDate()}.–${days[days.length - 1].getDate()}.`;
    const isCurrent = days.some((d) => d.getTime() === today.getTime());
    return { v, label, isCurrent };
  });
  const maxWeek = Math.max(1, ...weekSums.map((w) => w.v));

  const profiles = byProfile(visible, model.profiles);
  const topBills = [...visible].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const maxBill = topBills[0]?.amount ?? 1;
  const prevAmount = (i: Item) => {
    const hist = model.items.filter((x) => x.bill._id === i.bill._id && x.due < i.due);
    return hist.length ? hist[hist.length - 1].amount : undefined;
  };

  const statusWord = { all: "", unpaid: "neplaćene", late: "zakašnjele", paid: "plaćene" }[filters.status];
  const profileNames = filters.profiles.length
    ? model.profiles.filter((p) => filters.profiles.includes(p._id)).map((p) => p.name).join(", ")
    : "svi profili";
  const summary = [
    `Prikazano ${visible.length} od ${monthItems.length} ${plural(monthItems.length, "uplate", "uplate", "uplata")}`,
    statusWord,
    profileNames,
    filters.bills.length
      ? `${filters.bills.length} ${plural(filters.bills.length, "račun", "računa", "računa")}`
      : "",
    `zbroj ${formatMoney(t.total)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  if (model.profiles.length === 0) {
    return (
      <div className="mx-auto flex max-w-360 flex-col gap-5">
        <PageHeader title="Kalendar" />
        <EmptyState
          title="Kalendar je još prazan"
          action={<Button onClick={() => openProfile()}>Dodaj prvi profil</Button>}
        >
          Dodajte profil (stan, kuću, osobu), zatim njegove račune. Uplate će
          se pojaviti na dan dospijeća.
        </EmptyState>
      </div>
    );
  }

  const selectedItems = selectedDay ? byDate.get(selectedDay) ?? [] : [];

  return (
    <div className="mx-auto flex max-w-360 flex-col gap-4">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {monthTitle(month)}
            <span className="flex gap-1">
              <Button variant="outline" size="icon" aria-label="Prethodni mjesec" onClick={() => goMonth(addMonths(month, -1))}>
                <ChevronLeft aria-hidden />
              </Button>
              <Button variant="outline" size="icon" aria-label="Sljedeći mjesec" onClick={() => goMonth(addMonths(month, 1))}>
                <ChevronRight aria-hidden />
              </Button>
              {monthKey !== toMonthKey(today) && (
                <Button variant="outline" className="h-10" onClick={() => goMonth(today)}>
                  Danas
                </Button>
              )}
            </span>
          </span>
        }
      >
        <div role="group" aria-label="Prikaz" className="flex rounded-xl bg-secondary p-1">
          {(["month", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setParam("view", v === "month" ? null : v)}
              className={cn(
                "h-9 rounded-lg px-3.5 text-sm font-semibold",
                view === v ? "bg-card text-ink shadow-xs" : "text-muted-foreground",
              )}
            >
              {v === "month" ? "Mjesec" : "Popis"}
            </button>
          ))}
        </div>
        <Button onClick={() => openInstance()} className="hidden sm:inline-flex">
          <Plus aria-hidden /> Nova uplata
        </Button>
      </PageHeader>

      <FilterBar model={model} scopeItems={monthItems} summary={summary} />

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-[999_1_620px]">
          {view === "month" ? (
            <Card className="overflow-hidden">
              <div className="grid grid-cols-7 border-b border-line bg-[#FAFAF7]">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="px-1.5 py-2.5 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase md:px-2.5 md:text-left">
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: weeks * 7 }, (_, idx) => {
                  const d = addDays(gridStart, idx);
                  const iso = toISODate(d);
                  const inMonth = d.getMonth() === month.getMonth();
                  const isToday = d.getTime() === today.getTime();
                  const items = inMonth ? byDate.get(iso) ?? [] : [];
                  const daySum = sum(items);
                  const weekend = idx % 7 >= 5;
                  const selected = selectedDay === iso;
                  return (
                    <div
                      key={iso}
                      className={cn(
                        "group relative flex min-h-16 min-w-0 flex-col gap-1 border-r border-b border-line-soft p-1 md:min-h-29.5 md:p-1.5",
                        !inMonth ? "bg-[#F4F4EF]" : weekend ? "bg-[#FAFAF7]" : "bg-card",
                        (idx + 1) % 7 === 0 && "border-r-0",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          disabled={!inMonth}
                          onClick={() => setSelectedDay(selected ? null : iso)}
                          aria-label={`${shortDate(d)}${items.length ? `, ${items.length} ${plural(items.length, "uplata", "uplate", "uplata")}` : ""}`}
                          className={cn(
                            "grid h-7 min-w-7 place-items-center rounded-full px-1 text-[13px] md:pointer-events-none",
                            isToday ? "bg-lime font-bold" : "font-medium",
                            !inMonth && "text-[#6B707A]",
                            selected && "ring-2 ring-ink",
                          )}
                        >
                          {d.getDate()}
                        </button>
                        {items.length > 1 && (
                          <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
                            {formatAmount(daySum)}
                          </span>
                        )}
                        {inMonth && (
                          <button
                            type="button"
                            onClick={() => openInstance({ dueDate: iso })}
                            aria-label={`Dodaj uplatu za ${dayMonth(d)}`}
                            className="absolute right-1 bottom-1 hidden size-7 place-items-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-ink focus-visible:opacity-100 md:grid"
                          >
                            <Plus className="size-4" aria-hidden />
                          </button>
                        )}
                      </div>
                      {/* chips (tablet/desktop) */}
                      <div className="hidden flex-col gap-1 md:flex">
                        {items.map((i) => (
                          <button
                            key={i._id}
                            type="button"
                            onClick={() => openInstance({ item: i })}
                            title={`${i.bill.name} · ${i.profile.name} · ${formatMoney(i.amount)}`}
                            className={cn(
                              "flex min-w-0 items-center gap-1 rounded-md border border-l-[3px] px-1.5 py-1 text-left text-xs hover:brightness-[0.97]",
                              itemTone(i),
                            )}
                            style={{ borderLeftColor: i.profile.color }}
                          >
                            {i.status === "paid" && <Check className="size-3 shrink-0" strokeWidth={3} aria-hidden />}
                            <span className={cn("truncate", i.status === "paid" && "line-through")}>{i.bill.name}</span>
                            <span className={cn("ml-auto font-mono text-[11px]", i.status === "paid" && "line-through")}>
                              {formatAmount(i.amount)}
                            </span>
                          </button>
                        ))}
                      </div>
                      {/* dots (phone) */}
                      {items.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 md:hidden" aria-hidden>
                          {items.slice(0, 4).map((i) => (
                            <span
                              key={i._id}
                              className={cn("size-2 rounded-full", i.status === "paid" && "opacity-35")}
                              style={{ backgroundColor: i.status === "late" ? "#C2410C" : i.profile.color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <ListView items={visible} onOpen={(i) => openInstance({ item: i })} />
          )}

          {view === "month" && selectedDay && (
            <div className="mt-3 md:hidden">
              <p className="mb-2 text-sm font-semibold">{shortDate(new Date(`${selectedDay}T00:00:00`))}</p>
              {selectedItems.length ? (
                <ListView items={selectedItems} onOpen={(i) => openInstance({ item: i })} />
              ) : (
                <Button variant="outline" onClick={() => openInstance({ dueDate: selectedDay })}>
                  <Plus aria-hidden /> Dodaj uplatu za taj dan
                </Button>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-3 w-4.5 rounded-[3px] border border-line border-l-[3px] border-l-ink-2 bg-card" />Čeka</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-4.5 rounded-[3px] border-l-[3px] border-l-ink-2 bg-late-bg" />Kasni</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-4.5 rounded-[3px] border-l-[3px] border-l-ink-2 bg-paid-bg" />Plaćeno</span>
            <span>Lijevi rub = boja profila · klik na uplatu otvara uređivanje</span>
          </div>
        </div>

        {/* Stats rail */}
        <aside aria-label="Statistika odabira" className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
          <section className="rounded-2xl bg-ink p-4.5 text-white">
            <p className="text-[13px] text-[#B9BCC4]">Zbroj odabranog</p>
            <p className="mt-1.5 font-mono text-[30px] font-semibold tracking-tight">{formatMoney(t.total)}</p>
            <p className="mt-1 text-[13px] text-[#B9BCC4]">
              {scopePrev > 0
                ? `${formatPercent(((scopeNow - scopePrev) / scopePrev) * 100)} u odnosu na ${monthLabel(prevMonth).split(" ")[0]} (svi statusi)`
                : "Nema podataka za prošli mjesec"}
            </p>
            <div className="mt-3.5 flex h-2 overflow-hidden rounded-full bg-[#3A3F47]">
              <span className="bg-lime" style={{ width: `${t.total ? (t.paid / t.total) * 100 : 0}%` }} />
              <span className="bg-[#F59E5B]" style={{ width: `${t.total ? (t.late / t.total) * 100 : 0}%` }} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-[#B9BCC4]">Plaćeno</dt><dd className="font-mono text-[13px] font-semibold">{formatMoney(t.paid)}</dd></div>
              <div><dt className="text-[#B9BCC4]">Čeka</dt><dd className="font-mono text-[13px] font-semibold">{formatMoney(t.due)}</dd></div>
              <div><dt className="text-[#F8B98A]">Kasni</dt><dd className="font-mono text-[13px] font-semibold">{formatMoney(t.late)}</dd></div>
            </dl>
          </section>

          <Card className="p-4.5">
            <h2 className="text-sm font-bold">Kad treba novac</h2>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">Zbroj dospijeća po tjednima</p>
            <div className="flex h-27.5 items-end gap-2">
              {weekSums.map((w) => (
                <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${w.label}: ${formatMoney(w.v)}`}>
                  <span className="font-mono text-[10px] text-ink-2">{w.v > 0 ? Math.round(w.v) : ""}</span>
                  <div
                    className={cn("w-full rounded-t-[5px] rounded-b-[2px]", w.isCurrent ? "border-[1.5px] border-ink bg-lime" : "bg-ink")}
                    style={{ height: `${Math.max(2, (w.v / maxWeek) * 82)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-2">
              {weekSums.map((w) => (
                <span key={w.label} className="flex-1 text-center font-mono text-[10px] text-muted-foreground">{w.label}</span>
              ))}
            </div>
          </Card>

          {profiles.length > 0 && (
            <Card className="p-4.5">
              <h2 className="mb-3 text-sm font-bold">Po profilu</h2>
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-paper">
                {profiles.map((p) => (
                  <span key={p.profile._id} style={{ width: `${p.pct}%`, backgroundColor: p.profile.color }} />
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {profiles.map((p) => (
                  <div key={p.profile._id} className="flex items-center gap-2 text-[13px]">
                    <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: p.profile.color }} aria-hidden />
                    <span className="truncate">{p.profile.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{Math.round(p.pct)} %</span>
                    <span className="w-21 text-right font-mono font-semibold">{formatMoney(p.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {topBills.length > 0 && (
            <Card className="p-4.5">
              <h2 className="mb-3 text-sm font-bold">Najveći računi u odabiru</h2>
              <div className="flex flex-col gap-2.5">
                {topBills.map((i) => {
                  const prev = prevAmount(i);
                  const pct = prev && prev > 0 ? ((i.amount - prev) / prev) * 100 : 0;
                  return (
                    <div key={i._id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[13px]">
                        <span className="size-2 rounded-full" style={{ backgroundColor: i.profile.color }} aria-hidden />
                        <Link href={`/bills?bill=${i.bill._id}`} className="truncate font-semibold hover:underline">
                          {i.bill.name}
                        </Link>
                        {Math.abs(pct) >= 1 && (
                          <span className={cn("text-xs font-semibold", pct > 0 ? "text-late" : "text-[#3A5A1F]")}>
                            {pct > 0 ? "+" : "−"}{Math.abs(Math.round(pct))} %
                          </span>
                        )}
                        <span className="ml-auto font-mono font-semibold">{formatMoney(i.amount)}</span>
                      </div>
                      <div className="h-1.25 rounded-full bg-paper">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${(i.amount / maxBill) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link
                href={`/stats${params.toString() ? `?${new URLSearchParams([...params.entries()].filter(([k]) => ["status", "profiles", "bills"].includes(k))).toString()}` : ""}`}
                className="mt-3.5 inline-block text-[13px] font-semibold hover:underline"
              >
                Otvori u statistici →
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function ListView({ items, onOpen }: { items: Item[]; onOpen: (i: Item) => void }) {
  if (!items.length) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Nema uplata za odabrane filtre u ovom mjesecu.
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <ul>
        {items.map((i) => (
          <li key={i._id} className="border-b border-line-soft last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="flex w-full flex-wrap items-center gap-3.5 px-4 py-3 text-left hover:bg-[#FAFAF7]"
            >
              <span className="w-21.5 font-mono text-[13px] text-muted-foreground">{shortDate(i.due)}</span>
              <span className="h-7 w-1 rounded-sm" style={{ backgroundColor: i.profile.color }} aria-hidden />
              <span className="min-w-0 flex-[1_1_150px]">
                <span className="block truncate font-semibold">{i.bill.name}</span>
                <span className="text-xs text-muted-foreground">{i.profile.name}</span>
              </span>
              <StatusPill status={i.status} />
              <span className="w-21.5 text-right font-mono font-semibold">{formatMoney(i.amount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
