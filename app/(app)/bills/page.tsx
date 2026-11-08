"use client";

import { useMutation } from "convex/react";
import { Archive, ChevronDown, MoreHorizontal, Plus, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppActions } from "@/components/app/AppActions";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusPill,
} from "@/components/app/bits";
import { BillDrawer } from "@/components/app/BillDrawer";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useModel } from "@/hooks/use-model";
import { nextDueDay, type Item, type Model, type OBill } from "@/lib/data";
import { formatMoney, fullDate, plural, toMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Subtitle for a bill row: where the next instance's due day comes from. */
function dueText(bill: OBill, history: Item[]): string {
  const next = nextDueDay(bill, history);
  if (next.source === "bill") return `dospijeće ${next.day}. u mjesecu`;
  if (next.source === "last") return `dospijeće kao prošli mjesec (${next.day}.)`;
  return "dan dospijeća nije postavljen";
}

export default function BillsPage() {
  const state = useModel();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState error={state.error} />;
  return <Bills model={state.model} />;
}

function Bills({ model }: { model: Model }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { openBill, openProfile } = useAppActions();
  const setArchived = useMutation(api.bills.setBillArchived);
  const [query, setQuery] = useState("");
  const [openArchives, setOpenArchives] = useState<Set<string>>(new Set());

  const toggleArchive = (profileId: string) =>
    setOpenArchives((s) => {
      const next = new Set(s);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });

  const restore = async (b: OBill) => {
    const res = await setArchived({ id: b._id as Id<"bills">, archived: false });
    if (res.success) toast.success(`${b.name} je vraćen iz arhive.`);
    else toast.error(res.error || "Promjena nije uspjela.");
  };

  const selectedBill = params.get("bill");
  const focusProfile = params.get("profile");

  const setBill = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("bill", id);
    else next.delete("bill");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (focusProfile) {
      document.getElementById(`profil-${focusProfile}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusProfile]);

  const monthKey = toMonthKey(model.today);
  const history = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of model.items) m.set(i.bill._id, [...(m.get(i.bill._id) ?? []), i]);
    return m;
  }, [model.items]);

  const latest = (b: OBill) => {
    const h = history.get(b._id) ?? [];
    return h.length ? h[h.length - 1] : undefined;
  };
  const monthlyTotal = model.activeBills.reduce((a, b) => a + (latest(b)?.amount ?? 0), 0);
  const activeCount = model.activeBills.length;

  const q = query.trim().toLowerCase();
  const matches = (b: OBill) => {
    if (!q) return true;
    const p = model.profileById.get(b.profileId);
    return b.name.toLowerCase().includes(q) || (p?.name.toLowerCase().includes(q) ?? false);
  };

  const drawerBill = selectedBill ? model.billById.get(selectedBill) : undefined;

  return (
    <div className="mx-auto flex max-w-360 flex-col gap-5">
      <PageHeader
        title="Računi"
        eyebrow={
          activeCount
            ? `${activeCount} ${plural(activeCount, "račun", "računa", "računa")} u ${model.profiles.length} ${plural(model.profiles.length, "profilu", "profila", "profila")} · oko ${formatMoney(monthlyTotal)} mjesečno`
            : undefined
        }
      >
        <Button variant="outline" onClick={() => openProfile()}>
          Novi profil
        </Button>
        <Button onClick={() => openBill()} disabled={!model.profiles.length}>
          <Plus aria-hidden /> Novi račun
        </Button>
      </PageHeader>

      {model.profiles.length === 0 ? (
        <EmptyState
          title="Još nema profila"
          action={<Button onClick={() => openProfile()}>Dodaj prvi profil</Button>}
        >
          Računi se grupiraju po profilima – stan, kuća, roditelji. Svaki
          profil ima svoju boju koju vidite u kalendaru i statistici.
        </EmptyState>
      ) : (
        <>
          <label className="flex h-11 items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 text-muted-foreground focus-within:border-ink">
            <Search className="size-4" aria-hidden />
            <span className="sr-only">Pretraži račune</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pretraži račune ili profile…"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
            />
          </label>

          {model.profiles.map((p) => {
            const all = model.bills.filter((b) => b.profileId === p._id && matches(b));
            if (q && !all.length) return null;
            const bills = all.filter((b) => !b.archivedAt);
            const archived = all.filter((b) => b.archivedAt);
            const archiveOpen =
              openArchives.has(p._id) ||
              (!!q && archived.length > 0) ||
              archived.some((b) => b._id === selectedBill);
            const profileSum = bills.reduce((a, b) => a + (latest(b)?.amount ?? 0), 0);
            return (
              <Card
                key={p._id}
                id={`profil-${p._id}`}
                className={cn("scroll-mt-20 overflow-hidden", focusProfile === p._id && "ring-2 ring-ink")}
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4.5 py-3.5">
                  <span className="size-3 rounded-lg" style={{ backgroundColor: p.color }} aria-hidden />
                  <h2 className="text-base font-bold">{p.name}</h2>
                  {(p.address.city || p.address.street) && (
                    <span className="text-[13px] text-muted-foreground">
                      {[p.address.street, p.address.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[13px] text-ink-2">{formatMoney(profileSum)} / mj</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="size-9" aria-label={`Radnje za profil ${p.name}`}>
                        <MoreHorizontal aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openBill({ profileId: p._id })}>Novi račun u profilu</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => router.push(`/calendar?profiles=${p._id}`)}>Prikaži u kalendaru</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => router.push(`/stats?profiles=${p._id}`)}>Prikaži u statistici</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openProfile({ profileId: p._id })}>Uredi profil</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {bills.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-4 text-sm text-ink-2">
                    {archived.length ? "Ovaj profil nema aktivnih računa." : "Ovaj profil još nema računa."}
                    <Button size="sm" variant="outline" onClick={() => openBill({ profileId: p._id })}>
                      <Plus aria-hidden /> Dodaj račun
                    </Button>
                  </div>
                ) : (
                  <ul>
                    {bills.map((b) => {
                      const h = history.get(b._id) ?? [];
                      const last6 = h.slice(-6);
                      const max = Math.max(1, ...last6.map((i) => i.amount));
                      const cur = h.find((i) => i.dueMonth === monthKey);
                      const last = h[h.length - 1];
                      const selected = selectedBill === b._id;
                      return (
                        <li key={b._id} className="border-b border-paper last:border-b-0">
                          <button
                            type="button"
                            onClick={() => setBill(b._id)}
                            aria-current={selected ? "true" : undefined}
                            className={cn(
                              "flex w-full flex-wrap items-center gap-4 px-4.5 py-3 text-left",
                              selected ? "bg-lime-soft shadow-[inset_3px_0_0_var(--ink)]" : "hover:bg-[#FAFAF7]",
                            )}
                          >
                            <span className="min-w-0 flex-[1_1_170px]">
                              <span className="block truncate text-[15px] font-semibold">{b.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {dueText(b, h)}
                                {b.hasEBill ? " · e-račun" : ""}
                              </span>
                            </span>
                            <span className="flex h-6.5 w-16.5 items-end gap-0.75" aria-hidden>
                              {last6.map((i, k) => (
                                <span
                                  key={i._id}
                                  className={cn("min-h-0.5 flex-1 rounded-t-[2px]", k === last6.length - 1 ? "bg-ink" : "bg-[#B9BCC4]")}
                                  style={{ height: `${(i.amount / max) * 100}%` }}
                                />
                              ))}
                            </span>
                            <span className="w-22 text-right font-mono font-semibold">
                              {last ? formatMoney(last.amount) : "—"}
                            </span>
                            <span className="flex w-23 justify-end">
                              {cur ? (
                                <StatusPill status={cur.status} />
                              ) : (
                                <span className="text-xs text-muted-foreground">nema uplate</span>
                              )}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {archived.length > 0 && (
                  <div className="border-t border-line-soft bg-[#FAFAF7]">
                    <button
                      type="button"
                      aria-expanded={archiveOpen}
                      onClick={() => toggleArchive(p._id)}
                      className="flex w-full items-center gap-2.5 px-4.5 py-3 text-left text-sm font-semibold text-ink-2"
                    >
                      <ChevronDown className={cn("size-4 transition", !archiveOpen && "-rotate-90")} aria-hidden />
                      <Archive className="size-4" aria-hidden />
                      Arhivirano · {archived.length} {plural(archived.length, "račun", "računa", "računa")}
                    </button>
                    {archiveOpen && (
                      <ul>
                        {archived.map((b) => {
                          const h = history.get(b._id) ?? [];
                          const last = h[h.length - 1];
                          const selected = selectedBill === b._id;
                          return (
                            <li
                              key={b._id}
                              className={cn(
                                "flex items-center gap-3 border-t border-line-soft pr-4.5",
                                selected && "bg-lime-soft shadow-[inset_3px_0_0_var(--ink)]",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => setBill(b._id)}
                                aria-current={selected ? "true" : undefined}
                                className="flex min-w-0 flex-1 flex-wrap items-center gap-4 py-3 pl-4.5 text-left"
                              >
                                <span className="min-w-0 flex-[1_1_170px]">
                                  <span className="block truncate text-[15px] font-semibold text-ink-2">{b.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    arhiviran {fullDate(new Date(b.archivedAt!))} · {h.length}{" "}
                                    {plural(h.length, "uplata", "uplate", "uplata")} u povijesti
                                  </span>
                                </span>
                                <span className="w-22 text-right font-mono font-semibold text-ink-2">
                                  {last ? formatMoney(last.amount) : "—"}
                                </span>
                              </button>
                              <Button size="sm" variant="outline" onClick={() => void restore(b)}>
                                Vrati iz arhive
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}

      <BillDrawer
        model={model}
        bill={drawerBill}
        history={drawerBill ? history.get(drawerBill._id) ?? [] : []}
        onClose={() => setBill(null)}
      />
    </div>
  );
}
