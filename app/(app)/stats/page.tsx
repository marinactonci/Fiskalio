"use client";

import { Clock, Coins, Sun, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppActions } from "@/components/app/AppActions";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/app/bits";
import { FilterBar } from "@/components/app/FilterBar";
import { useFilters } from "@/hooks/use-filters";
import { useModel } from "@/hooks/use-model";
import { inScope, sum, type Item, type Model, type OBill } from "@/lib/data";
import {
  addMonths,
  formatMoney,
  formatPercent,
  monthLabel,
  MONTHS_HR_SHORT,
  plural,
  toMonthKey,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const PERIODS = [
  { key: "3", label: "3 mj" },
  { key: "6", label: "6 mj" },
  { key: "12", label: "12 mj" },
  { key: "ytd", label: "Ova godina" },
] as const;

const RAMP = ["#ECEDF0", "#C9CCD3", "#9399A6", "#5C6373", "#2A2F3A"];

export default function StatsPage() {
  const state = useModel();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState error={state.error} />;
  return <Stats model={state.model} />;
}

function niceMax(v: number): number {
  if (v <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(v));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) if (s * mag >= v) return s * mag;
  return 10 * mag;
}

function Stats({ model }: { model: Model }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { filters } = useFilters();
  const { openInstance, openProfile } = useAppActions();
  const [scale, setScale] = useState<"row" | "shared">("row");
  const [showTable, setShowTable] = useState(false);

  const today = model.today;
  const periodKey = (params.get("p") ?? "12") as (typeof PERIODS)[number]["key"];
  const count =
    periodKey === "ytd" ? today.getMonth() + 1 : Number(periodKey) || 12;
  const months = Array.from({ length: count }, (_, k) => addMonths(today, k - count + 1));
  const monthKeys = months.map(toMonthKey);

  const setPeriod = (k: string) => {
    const next = new URLSearchParams(params);
    if (k === "12") next.delete("p");
    else next.set("p", k);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const scoped = useMemo(
    () => model.items.filter((i) => inScope(i, filters) && monthKeys.includes(i.dueMonth)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model.items, filters, monthKeys.join()],
  );

  const total = sum(scoped);
  const perMonth = monthKeys.map((k) => sum(scoped.filter((i) => i.dueMonth === k)));
  let maxIdx = 0;
  perMonth.forEach((v, i) => {
    if (v > perMonth[maxIdx]) maxIdx = i;
  });
  const billsInScope = new Set(scoped.map((i) => i.bill._id));
  const profilesInScope = model.profiles.filter((p) => scoped.some((i) => i.profile._id === p._id));

  // On-time payments (only instances with a recorded payment date).
  const withPaidAt = scoped.filter((i) => i.isPaid && i.paidAt);
  const onTime = withPaidAt.filter((i) => i.paidAt! < i.due.getTime() + 86_400_000);

  const curKey = toMonthKey(today);
  const prevKey = toMonthKey(addMonths(today, -1));
  const allScoped = model.items.filter((i) => inScope(i, filters));
  const cur = sum(allScoped.filter((i) => i.dueMonth === curKey));
  const prev = sum(allScoped.filter((i) => i.dueMonth === prevKey));

  // Stacked bars
  const yMax = niceMax(Math.max(...perMonth, 1));
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(yMax * f));

  const insights = buildInsights(model, scoped, months);

  // Heatmap rows grouped by profile
  const groups = profilesInScope.map((p) => {
    const bills = model.bills.filter((b) => b.profileId === p._id && billsInScope.has(b._id));
    return { profile: p, bills };
  });
  const cellValue = (b: OBill, k: string) => scoped.filter((i) => i.bill._id === b._id && i.dueMonth === k);
  const sharedMax = Math.max(
    1,
    ...model.bills.flatMap((b) => monthKeys.map((k) => sum(cellValue(b, k)))),
  );

  if (model.profiles.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <PageHeader title="Statistika" />
        <EmptyState title="Još nema podataka" action={<Button onClick={() => openProfile()}>Dodaj prvi profil</Button>}>
          Statistika se puni sama kako budete označavali uplate.
        </EmptyState>
      </div>
    );
  }

  const exportCsv = () => {
    const rows = [
      ["Profil", "Račun", "Razdoblje", "Dospijeće", "Iznos (EUR)", "Status"],
      ...scoped.map((i) => [
        i.profile.name,
        i.bill.name,
        i.period ? monthLabel(i.period) : i.month,
        i.dueDate,
        i.amount.toFixed(2).replace(".", ","),
        i.status === "paid" ? "plaćeno" : i.status === "late" ? "kasni" : "čeka",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fiskalio-statistika-${monthKeys[0]}-${monthKeys[monthKeys.length - 1]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mx-auto flex max-w-[1180px] flex-col gap-4">
      <PageHeader eyebrow={`${monthLabel(months[0])} – ${monthLabel(months[months.length - 1])}`} title="Statistika">
        <Button variant="outline" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable}>
          {showTable ? "Sakrij tablicu" : "Prikaži kao tablicu"}
        </Button>
        <Button variant="outline" onClick={exportCsv} disabled={!scoped.length}>
          Izvezi CSV
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-start gap-2.5">
        <div role="group" aria-label="Razdoblje" className="flex rounded-xl border border-line bg-card p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={periodKey === p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "h-9 rounded-lg px-3 text-[13px] font-semibold",
                periodKey === p.key ? "bg-ink text-white" : "text-ink-2 hover:bg-secondary",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <FilterBar model={model} scopeItems={scoped} showStatus={false} />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <p className="text-[13px] text-[#B9BCC4]">Ukupno u razdoblju</p>
          <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight">{formatMoney(total)}</p>
          <p className="mt-1.5 text-[13px] text-[#B9BCC4]">
            {scoped.length} {plural(scoped.length, "uplata", "uplate", "uplata")} · {billsInScope.size}{" "}
            {plural(billsInScope.size, "račun", "računa", "računa")}
          </p>
        </div>
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">Prosječan mjesec</p>
          <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight">{formatMoney(total / count)}</p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            najskuplji: {monthLabel(months[maxIdx])}, {formatMoney(perMonth[maxIdx])}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">Plaćeno na vrijeme</p>
          <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight">
            {withPaidAt.length ? `${Math.round((onTime.length / withPaidAt.length) * 100)} %` : "—"}
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {withPaidAt.length
              ? `${onTime.length} od ${withPaidAt.length} s datumom plaćanja`
              : "Datum plaćanja bilježi se od sada"}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">
            {monthLabel(today).split(" ")[0]} u odnosu na {monthLabel(addMonths(today, -1)).split(" ")[0]}
          </p>
          <p className="mt-2 font-mono text-[28px] font-semibold tracking-tight">
            {prev > 0 ? formatPercent(((cur - prev) / prev) * 100) : "—"}
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            {formatMoney(cur)} naspram {formatMoney(prev)}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-stretch gap-4">
        {/* Stacked bars */}
        <Card className="min-w-0 flex-[2_1_560px] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Mjesečni trošak po profilu</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Prijeđite mišem preko stupca za iznose</p>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
              {profilesInScope.map((p) => (
                <li key={p._id} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: p.color }} aria-hidden />
                  {p.name}
                  <span className="font-mono text-muted-foreground">
                    {formatMoney(sum(scoped.filter((i) => i.profile._id === p._id)))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 flex gap-2.5">
            <div className="flex h-[240px] w-11 flex-col justify-between text-right font-mono text-[11px] text-muted-foreground" aria-hidden>
              {ticks.map((t, k) => (
                <span key={k} className={cn(k === 0 && "-translate-y-1.5", k === ticks.length - 1 && "translate-y-1.5")}>
                  {t}
                </span>
              ))}
            </div>
            <div className="relative h-[240px] min-w-0 flex-1">
              <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
                {ticks.map((_, k) => (
                  <span key={k} className={cn("border-t", k === ticks.length - 1 ? "border-input" : "border-line-soft")} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-end gap-[clamp(4px,1.2vw,14px)]">
                {months.map((m, idx) => {
                  const k = monthKeys[idx];
                  const segs = [...profilesInScope].reverse().map((p) => ({
                    p,
                    v: sum(scoped.filter((i) => i.dueMonth === k && i.profile._id === p._id)),
                  }));
                  const isCur = k === curKey;
                  return (
                    <div
                      key={k}
                      className="relative flex min-w-0 flex-1 flex-col justify-end gap-[2px]"
                      style={{ height: `${(perMonth[idx] / yMax) * 100}%` }}
                      title={`${monthLabel(m)} · ukupno ${formatMoney(perMonth[idx])}`}
                    >
                      {isCur && perMonth[idx] > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[11px] font-semibold whitespace-nowrap">
                          {Math.round(perMonth[idx])} €
                        </span>
                      )}
                      {segs
                        .filter((s) => s.v > 0)
                        .map((s, si) => (
                          <div
                            key={s.p._id}
                            title={`${monthLabel(m)} · ${s.p.name} · ${formatMoney(s.v)}`}
                            className={cn("min-h-[2px] hover:brightness-110", si === 0 && "rounded-t-[4px]")}
                            style={{ flexGrow: s.v, backgroundColor: s.p.color }}
                          />
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-2 ml-[54px] flex gap-[clamp(4px,1.2vw,14px)]">
            {months.map((m, idx) => (
              <span
                key={monthKeys[idx]}
                className={cn(
                  "min-w-0 flex-1 truncate text-center text-xs",
                  monthKeys[idx] === curKey ? "font-bold text-ink" : "text-muted-foreground",
                )}
              >
                {MONTHS_HR_SHORT[m.getMonth()]}
              </span>
            ))}
          </div>

          {showTable && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <caption className="sr-only">Mjesečni trošak po profilu</caption>
                <thead>
                  <tr className="border-b border-line text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-semibold">Mjesec</th>
                    {profilesInScope.map((p) => (
                      <th key={p._id} scope="col" className="py-2 pr-3 text-right font-semibold">{p.name}</th>
                    ))}
                    <th scope="col" className="py-2 text-right font-semibold">Ukupno</th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, idx) => (
                    <tr key={monthKeys[idx]} className="border-b border-line-soft">
                      <th scope="row" className="py-2 pr-3 font-medium">{monthLabel(m)}</th>
                      {profilesInScope.map((p) => (
                        <td key={p._id} className="py-2 pr-3 text-right font-mono">
                          {formatMoney(sum(scoped.filter((i) => i.dueMonth === monthKeys[idx] && i.profile._id === p._id)))}
                        </td>
                      ))}
                      <td className="py-2 text-right font-mono font-semibold">{formatMoney(perMonth[idx])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Insights */}
        <Card className="flex min-w-0 flex-[1_1_300px] flex-col p-5">
          <h2 className="mb-2 text-base font-bold">Uočene promjene</h2>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Kad se nakupi nekoliko mjeseci uplata, ovdje će se pojaviti poskupljenja, sezonski skokovi i
              računi koji kasne.
            </p>
          ) : (
            insights.map((ins, k) => (
              <div key={k} className={cn("flex gap-3 py-3", k < insights.length - 1 && "border-b border-line-soft")}>
                <span
                  className={cn(
                    "grid size-[34px] shrink-0 place-items-center rounded-lg",
                    ins.icon === "late" ? "bg-late-bg text-late" : "bg-paper",
                  )}
                >
                  {ins.icon === "price" && <Coins className="size-4" aria-hidden />}
                  {ins.icon === "up" && <TrendingUp className="size-4" aria-hidden />}
                  {ins.icon === "season" && <Sun className="size-4" aria-hidden />}
                  {ins.icon === "late" && <Clock className="size-4" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{ins.title}</p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{ins.text}</p>
                  {ins.href && (
                    <Link href={ins.href} className="text-[13px] font-semibold hover:underline">
                      Otvori račun
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Računi kroz mjesece</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Svaki redak je jedan račun. Tamnije = skuplji mjesec. Klik na polje otvara uplatu.
            </p>
          </div>
          <div role="group" aria-label="Skala boja" className="flex rounded-xl bg-paper p-1 text-[13px] font-semibold">
            {(["row", "shared"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={scale === s}
                onClick={() => setScale(s)}
                className={cn("h-8 rounded-lg px-3", scale === s ? "bg-card text-ink shadow-xs" : "text-muted-foreground")}
              >
                {s === "row" ? "Skala po računu" : "Zajednička skala"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div style={{ minWidth: 240 + count * 44 + 200 }}>
            <div
              className="grid items-end gap-1 pb-1.5 text-xs text-muted-foreground"
              style={{ gridTemplateColumns: `200px repeat(${count}, minmax(0, 1fr)) 96px 104px` }}
            >
              <span />
              {months.map((m, idx) => (
                <span key={monthKeys[idx]} className={cn("text-center", monthKeys[idx] === curKey && "font-bold text-ink")}>
                  {MONTHS_HR_SHORT[m.getMonth()]}
                </span>
              ))}
              <span className="text-right">prosjek</span>
              <span className="text-right">ukupno</span>
            </div>
            {groups.map(({ profile, bills }) => (
              <div key={profile._id}>
                <div className="flex items-center gap-2 pt-3 pb-1.5 text-xs font-bold tracking-wider text-ink-2 uppercase">
                  <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: profile.color }} aria-hidden />
                  {profile.name}
                  <span className="font-mono font-medium tracking-normal normal-case text-muted-foreground">
                    {formatMoney(sum(scoped.filter((i) => i.profile._id === profile._id)))}
                  </span>
                </div>
                {bills.map((b) => {
                  const vals = monthKeys.map((k) => cellValue(b, k));
                  const sums = vals.map((v) => sum(v));
                  const present = sums.filter((_, k) => vals[k].length > 0);
                  const mn = Math.min(...present);
                  const mx = Math.max(...present);
                  const rowTotal = sums.reduce((a, v) => a + v, 0);
                  return (
                    <div
                      key={b._id}
                      className="grid items-center gap-1 py-0.5"
                      style={{ gridTemplateColumns: `200px repeat(${count}, minmax(0, 1fr)) 96px 104px` }}
                    >
                      <Link href={`/bills?bill=${b._id}`} className="truncate text-[13px] font-semibold hover:underline">
                        {b.name}
                      </Link>
                      {vals.map((v, k) => {
                        const label = `${b.name} · ${monthLabel(months[k])}`;
                        if (!v.length) {
                          return <span key={k} className="h-[30px] rounded-[5px] bg-[#F7F7F3]" title={`${label} · nema uplate`} />;
                        }
                        const val = sums[k];
                        const step =
                          scale === "shared"
                            ? Math.min(4, Math.floor((val / sharedMax) * 5))
                            : mx - mn < 0.01
                              ? 1
                              : Math.min(4, Math.floor(((val - mn) / (mx - mn)) * 5));
                        const unpaid = v.some((i) => i.status !== "paid");
                        const late = v.some(
                          (i) => i.status === "late" || (i.paidAt && i.paidAt >= i.due.getTime() + 86_400_000),
                        );
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => openInstance({ item: v[0] })}
                            title={`${label} · ${formatMoney(val)}${unpaid ? " · čeka" : ""}${late ? " · kasni" : ""}`}
                            aria-label={`${label}: ${formatMoney(val)}${unpaid ? ", čeka plaćanje" : ""}${late ? ", kasni" : ""}`}
                            className={cn(
                              "relative h-[30px] rounded-[5px] hover:outline-2 hover:outline-offset-1 hover:outline-ink",
                              unpaid && "border-[1.5px] border-dashed border-[#9399A6] bg-card",
                            )}
                            style={unpaid ? undefined : { backgroundColor: RAMP[step] }}
                          >
                            {late && (
                              <span className="absolute top-[3px] right-[3px] size-2 rounded-full bg-[#E2620F] shadow-[0_0_0_2px_#fff]" />
                            )}
                          </button>
                        );
                      })}
                      <span className="text-right font-mono text-xs text-ink-2">
                        {present.length ? formatMoney(rowTotal / present.length) : "—"}
                      </span>
                      <span className="text-right font-mono text-[13px] font-semibold">{formatMoney(rowTotal)}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            {groups.length === 0 && (
              <p className="py-6 text-sm text-muted-foreground">Nema uplata u odabranom razdoblju.</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            niže
            <span className="flex gap-0.5" aria-hidden>
              {RAMP.map((c) => (
                <span key={c} className="h-3 w-[18px] rounded-[3px]" style={{ backgroundColor: c }} />
              ))}
            </span>
            više {scale === "row" ? "(za taj račun)" : "(svi računi)"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-[18px] rounded-[3px] border-[1.5px] border-dashed border-[#9399A6]" aria-hidden />
            čeka plaćanje
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#E2620F]" aria-hidden />
            kasni / plaćeno sa zakašnjenjem
          </span>
        </div>
      </Card>
    </div>
  );
}

type Insight = { icon: "price" | "up" | "season" | "late"; title: string; text: string; href?: string };

function buildInsights(model: Model, scoped: Item[], months: Date[]): Insight[] {
  const out: Insight[] = [];
  const byBill = new Map<string, Item[]>();
  for (const i of scoped) byBill.set(i.bill._id, [...(byBill.get(i.bill._id) ?? []), i]);

  // 1. Step price change on otherwise fixed bills (e.g. internet, TV).
  for (const [billId, h] of byBill) {
    if (h.length < 4) continue;
    const v = h.map((i) => Math.round(i.amount * 100));
    for (let k = v.length - 1; k >= 2; k--) {
      const after = v.slice(k);
      const before = v.slice(Math.max(0, k - 2), k);
      if (
        after.length >= 2 &&
        after.every((x) => x === after[0]) &&
        before.length === 2 &&
        before.every((x) => x === before[0]) &&
        before[0] !== after[0]
      ) {
        const from = before[0] / 100;
        const to = after[0] / 100;
        const pct = ((to - from) / from) * 100;
        out.push({
          icon: "price",
          title: `${h[0].bill.name} je ${to > from ? "poskupio" : "pojeftinio"}`,
          text: `${formatMoney(from)} → ${formatMoney(to)} (${formatPercent(pct, 0)}) od ${monthLabel(h[k].due)}. Iznos je otad isti, pa je promjena trajna.`,
          href: `/bills?bill=${billId}`,
        });
        break;
      }
    }
  }

  // 2. Biggest jump between the last two instances of a variable bill.
  let best: { item: Item; prev: Item; pct: number } | null = null;
  for (const h of byBill.values()) {
    if (h.length < 2) continue;
    const a = h[h.length - 2];
    const b = h[h.length - 1];
    if (a.amount <= 0 || b.isEstimated) continue;
    const pct = ((b.amount - a.amount) / a.amount) * 100;
    if (pct >= 10 && (!best || pct > best.pct)) best = { item: b, prev: a, pct };
  }
  if (best) {
    out.push({
      icon: "up",
      title: `${best.item.bill.name} raste`,
      text: `${formatPercent(best.pct, 0)} u odnosu na prošlu uplatu (${formatMoney(best.prev.amount)} → ${formatMoney(best.item.amount)}), ${best.item.profile.name}.`,
      href: `/bills?bill=${best.item.bill._id}`,
    });
  }

  // 3. Seasonal profile: one or two months far above the profile's usual month.
  if (months.length >= 6) {
    for (const p of model.profiles) {
      const per = months.map((m) => sum(scoped.filter((i) => i.profile._id === p._id && i.dueMonth === toMonthKey(m))));
      const nonZero = per.filter((v) => v > 0);
      if (nonZero.length < 6) continue;
      const sorted = [...per].map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
      const top = sorted.slice(0, 2);
      const rest = sorted.slice(2).filter((x) => x.v > 0);
      const topAvg = (top[0].v + top[1].v) / 2;
      const restAvg = rest.reduce((a, x) => a + x.v, 0) / Math.max(1, rest.length);
      if (restAvg > 0 && topAvg / restAvg >= 1.6) {
        const names = top
          .map((x) => monthLabel(months[x.i]).split(" ")[0])
          .sort()
          .join(" i ");
        out.push({
          icon: "season",
          title: `${p.name}: sezonski skok`,
          text: `${names[0].toUpperCase()}${names.slice(1)} u prosjeku ${formatMoney(topAvg)} naspram ${formatMoney(restAvg)} ostalih mjeseci (${(topAvg / restAvg).toFixed(1).replace(".", ",")}×).`,
        });
        break;
      }
    }
  }

  // 4. Bill that is most often late.
  let worst: { billId: string; n: number; name: string } | null = null;
  for (const [billId, h] of byBill) {
    const n = h.filter(
      (i) => i.status === "late" || (i.paidAt && i.paidAt >= i.due.getTime() + 86_400_000),
    ).length;
    if (n >= 2 && (!worst || n > worst.n)) worst = { billId, n, name: h[0].bill.name };
  }
  if (worst) {
    const bill = model.billById.get(worst.billId);
    out.push({
      icon: "late",
      title: `${worst.name} najčešće kasni`,
      text: `${worst.n} ${plural(worst.n, "put", "puta", "puta")} u ovom razdoblju${bill?.dueDay ? `, dospijeće je ${bill.dueDay}. u mjesecu` : ""}. Možda pomaže pomaknuti plaćanje ranije.`,
      href: `/bills?bill=${worst.billId}`,
    });
  }

  return out.slice(0, 4);
}
