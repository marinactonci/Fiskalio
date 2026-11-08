"use client";

import { ChevronDown, Pencil, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppActions } from "@/components/app/AppActions";
import {
  Card,
  EBillLink,
  EmptyState,
  ErrorState,
  EstimatedChip,
  LoadingState,
  PageHeader,
  PaidToggle,
} from "@/components/app/bits";
import { FilterBar } from "@/components/app/FilterBar";
import { useFilters } from "@/hooks/use-filters";
import { useModel } from "@/hooks/use-model";
import {
  byProfile,
  groupByDueMonth,
  groupOpenItems,
  inScope,
  lastChange,
  openItems,
  sum,
  totals,
  type Item,
  type Model,
} from "@/lib/data";
import {
  addMonths,
  formatMoney,
  formatPercent,
  longToday,
  monthLabel,
  monthTitle,
  plural,
  relativeDue,
  shortDate,
  toMonthKey,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const state = useModel();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState error={state.error} />;
  return <Dashboard model={state.model} />;
}

function Dashboard({ model }: { model: Model }) {
  const { filters } = useFilters();
  const { openInstance, openProfile, openBill } = useAppActions();
  const [showPaid, setShowPaid] = useState(false);

  const today = model.today;
  const monthKey = toMonthKey(today);
  const prevKey = toMonthKey(addMonths(today, -1));
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Status filter is ignored here on purpose: the dashboard always shows
  // what is open and what is paid. Profile/bill scope applies.
  const scoped = useMemo(
    () => model.items.filter((i) => inScope(i, filters)),
    [model.items, filters],
  );
  const thisMonth = scoped.filter((i) => i.dueMonth === monthKey);
  const t = totals(thisMonth);
  const allLate = scoped.filter((i) => i.status === "late");
  const lateSum = sum(allLate);
  const prevTotal = sum(scoped.filter((i) => i.dueMonth === prevKey));
  const paidThisMonth = thisMonth.filter((i) => i.status === "paid");
  const groups = groupOpenItems(openItems(scoped, today), today);

  const profileSplit = byProfile(thisMonth, model.profiles);
  const estimated = thisMonth.filter((i) => i.isEstimated && i.status !== "paid");

  // Biggest increase among this month's instances vs. the previous instance.
  const increases = model.bills
    .filter((b) => thisMonth.some((i) => i.bill._id === b._id))
    .map((b) => lastChange(model.items.filter((i) => i.bill._id === b._id && i.due <= monthEnd)))
    .filter((c): c is NonNullable<typeof c> => !!c && c.pct >= 10 && !c.current.isEstimated)
    .sort((a, b) => b.pct - a.pct);

  const nextOpenCount = model.activeBills.filter((b) => {
    const p = b.profileId;
    return (
      (filters.profiles.length === 0 || filters.profiles.includes(p)) &&
      (filters.bills.length === 0 || filters.bills.includes(b._id))
    );
  }).length;
  const daysToNext = Math.round(
    (new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime() - today.getTime()) / 86_400_000,
  );

  if (model.profiles.length === 0) {
    return (
      <div className="mx-auto flex max-w-369 flex-col gap-6">
        <PageHeader eyebrow={longToday(today)} title="Dobro došli u Fiskalio" />
        <EmptyState
          title="Krenimo od prvog profila"
          action={<Button onClick={() => openProfile()}>Dodaj profil</Button>}
        >
          Profil je mjesto ili osoba za koju plaćate račune – npr. „Stan
          Trešnjevka” ili „Mama”. Zatim mu dodate račune (struja, voda,
          internet), a Fiskalio svaki mjesec sam otvara nove uplate.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-360 flex-col gap-5">
      <PageHeader eyebrow={longToday(today)} title={monthTitle(today)}>
        <Button onClick={() => openInstance()} className="hidden sm:inline-flex">
          <Plus aria-hidden /> Nova uplata
        </Button>
      </PageHeader>

      {model.profiles.length > 1 && (
        <FilterBar model={model} scopeItems={thisMonth} showStatus={false} />
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <p className="text-[13px] text-[#B9BCC4]">Preostalo za platiti</p>
          <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight">{formatMoney(t.due + t.late)}</p>
          <p className="mt-1.5 text-[13px] text-[#B9BCC4]">
            {t.dueCount + t.lateCount} {plural(t.dueCount + t.lateCount, "uplata", "uplate", "uplata")} do {monthEnd.getDate()}.{monthEnd.getMonth() + 1}.
          </p>
        </div>
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">Plaćeno</p>
          <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight">{formatMoney(t.paid)}</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
            <div className="h-full bg-ink" style={{ width: `${t.total ? (t.paid / t.total) * 100 : 0}%` }} />
          </div>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {t.paidCount} od {t.count} · {t.total ? Math.round((t.paid / t.total) * 100) : 0} % iznosa
          </p>
        </Card>
        <div
          className={cn(
            "rounded-2xl border p-5",
            allLate.length ? "border-late-border bg-late-bg" : "border-line bg-card",
          )}
        >
          <p className={cn("text-[13px] font-semibold", allLate.length ? "text-late" : "text-muted-foreground")}>
            Kasni
          </p>
          <p className={cn("mt-2 font-mono text-[28px] font-semibold tracking-tight", allLate.length && "text-late-strong")}>
            {formatMoney(lateSum)}
          </p>
          <p className={cn("mt-1.5 text-[13px]", allLate.length ? "text-late" : "text-muted-foreground")}>
            {allLate.length
              ? `${allLate.length} ${plural(allLate.length, "uplata", "uplate", "uplata")} · ${allLate
                  .slice(0, 2)
                  .map((i) => i.bill.name)
                  .join(", ")}`
              : "Ništa ne kasni"}
          </p>
        </div>
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">Ukupno ovaj mjesec</p>
          <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight">{formatMoney(t.total)}</p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {prevTotal > 0 ? (
              <>
                <span className="font-semibold text-ink">{formatPercent(((t.total - prevTotal) / prevTotal) * 100)}</span>{" "}
                u odnosu na {monthLabel(addMonths(today, -1)).split(" ")[0]}
              </>
            ) : (
              "Prvi mjesec s podacima"
            )}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        {/* Open list */}
        <Card className="min-w-0 flex-[999_1_520px] overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
            <h2 className="text-[17px] font-bold">Na redu</h2>
            <Link href="/calendar?status=unpaid" className="text-[13px] font-semibold hover:underline">
              Kalendar →
            </Link>
          </div>
          {groups.length === 0 && (
            <p className="px-5 py-8 text-ink-2">
              Sve je plaćeno. Nove uplate otvorit će se 1. u mjesecu.
            </p>
          )}
          {groups.map((g) => (
            <div key={g.key}>
              <div className="flex items-baseline gap-2.5 px-5 pt-3.5 pb-1.5">
                <span className={cn("text-xs font-bold tracking-wider uppercase", g.tone === "late" ? "text-late" : "text-ink")}>
                  {g.title}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{formatMoney(sum(g.items))}</span>
              </div>
              {g.tone === "late" && new Set(g.items.map((i) => i.dueMonth)).size > 1 ? (
                groupByDueMonth(g.items).map((month) => (
                  <div key={month.key}>
                    <div className="px-5 pt-2.5 pb-1 text-xs font-semibold text-muted-foreground capitalize">{month.label}</div>
                    <ul>
                      {month.items.map((i) => (
                        <OpenRow key={i._id} item={i} today={today} onEdit={() => openInstance({ item: i })} />
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <ul>
                  {g.items.map((i) => (
                    <OpenRow key={i._id} item={i} today={today} onEdit={() => openInstance({ item: i })} />
                  ))}
                </ul>
              )}
            </div>
          ))}
          {paidThisMonth.length > 0 && (
            <div className="border-t border-line-soft">
              <button
                type="button"
                aria-expanded={showPaid}
                onClick={() => setShowPaid((s) => !s)}
                className="flex w-full items-center gap-2.5 bg-[#FAFAF7] px-5 py-3.5 text-left text-sm font-semibold text-ink-2"
              >
                <ChevronDown className={cn("size-4 transition", !showPaid && "-rotate-90")} aria-hidden />
                Plaćeno ovaj mjesec · {paidThisMonth.length}{" "}
                {plural(paidThisMonth.length, "uplata", "uplate", "uplata")} · {formatMoney(sum(paidThisMonth))}
              </button>
              {showPaid && (
                <ul>
                  {paidThisMonth.map((i) => (
                    <OpenRow key={i._id} item={i} today={today} onEdit={() => openInstance({ item: i })} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        {/* Side */}
        <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
          {profileSplit.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3.5 text-[15px] font-bold">Ovaj mjesec po profilu</h2>
              <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
                {profileSplit.map((p) => (
                  <span key={p.profile._id} style={{ width: `${p.pct}%`, backgroundColor: p.profile.color }} />
                ))}
              </div>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {profileSplit.map((p) => (
                  <Link
                    key={p.profile._id}
                    href={`/calendar?profiles=${p.profile._id}`}
                    className="flex items-center gap-2.5 text-sm hover:underline"
                  >
                    <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: p.profile.color }} aria-hidden />
                    {p.profile.name}
                    <span className="ml-auto font-mono font-semibold">{formatMoney(p.value)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {(increases.length > 0 || estimated.length > 0) && (
            <Card className="flex flex-col gap-3.5 p-5">
              <h2 className="text-[15px] font-bold">Vrijedi pogledati</h2>
              {increases.slice(0, 2).map((c) => (
                <div key={c.current._id} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper">
                    <TrendingUp className="size-4" aria-hidden />
                  </span>
                  <p className="text-sm">
                    <b>{c.current.bill.name}</b> ({c.current.profile.name}) je {Math.round(c.pct)} % skuplji nego
                    prošli put ({formatMoney(c.previous.amount)} → {formatMoney(c.current.amount)}).
                    <br />
                    <Link href={`/bills?bill=${c.current.bill._id}`} className="text-[13px] font-semibold hover:underline">
                      Pogledaj trend
                    </Link>
                  </p>
                </div>
              ))}
              {estimated.length > 0 && (
                <div className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-paper">
                    <Pencil className="size-4" aria-hidden />
                  </span>
                  <p className="text-sm">
                    {estimated.length} {plural(estimated.length, "iznos je", "iznosa su", "iznosa su")} još{" "}
                    <b>{plural(estimated.length, "procjena", "procjene", "procjene")}</b> iz prošlog mjeseca. Potvrdite
                    ih kad stignu računi.
                  </p>
                </div>
              )}
            </Card>
          )}

          <section className="rounded-2xl bg-lime p-5">
            {model.activeBills.length ? (
              <>
                <p className="font-bold">
                  {monthTitle(addMonths(today, 1)).split(" ")[0]} se otvara za {daysToNext}{" "}
                  {plural(daysToNext, "dan", "dana", "dana")}
                </p>
                <p className="mt-1.5 text-[#2A2E35]">
                  1.{addMonths(today, 1).getMonth() + 1}. u 00:01 otvorit će se {nextOpenCount}{" "}
                  {plural(nextOpenCount, "nova uplata", "nove uplate", "novih uplata")} s prošlomjesečnim iznosima i datumima dospijeća.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">Dodajte prvi račun</p>
                <p className="mt-1.5 text-[#2A2E35]">Struja, voda, internet – sve što plaćate svaki mjesec.</p>
                <Button className="mt-3" onClick={() => openBill()}>
                  Novi račun
                </Button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function OpenRow({ item: i, today, onEdit }: { item: Item; today: Date; onEdit: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-3.5 border-t border-paper px-5 py-2.5 hover:bg-[#FAFAF7]">
      <PaidToggle item={i} />
      <div className="min-w-0 flex-[1_1_180px]">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onEdit} className="text-left text-[15px] font-semibold hover:underline">
            {i.bill.name}
          </button>
          {i.isEstimated && i.status !== "paid" && <EstimatedChip />}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: i.profile.color }} aria-hidden />
          {i.profile.name}
        </div>
      </div>
      <span
        className={cn(
          "w-32 text-[13px]",
          i.status === "late" ? "font-semibold text-late" : "text-muted-foreground",
        )}
      >
        {shortDate(i.due)}
        {i.status !== "paid" && ` · ${relativeDue(i.due, today)}`}
      </span>
      <span className={cn("w-23 text-right font-mono text-[15px] font-semibold", i.status === "paid" && "text-muted-foreground line-through")}>
        {formatMoney(i.amount)}
      </span>
      {i.bill.eBillLink ? (
        <EBillLink href={i.bill.eBillLink} name={i.bill.name} />
      ) : (
        <span className="size-9 shrink-0" aria-hidden />
      )}
    </li>
  );
}
