"use client";

import { useMutation, useQuery } from "convex/react";
import { Archive, Check, Copy, ExternalLink, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAppActions } from "@/components/app/AppActions";
import { EstimatedChip, StatusPill } from "@/components/app/bits";
import { nextDueDay, type Item, type Model, type OBill } from "@/lib/data";
import {
  formatMoney,
  formatPercent,
  fullDate,
  monthLabel,
  monthShortLabel,
  shortDate,
  toMonthKey,
} from "@/lib/format";
import { cn, decryptString } from "@/lib/utils";

/** Bill detail as a side panel, reachable from any view via /bills?bill=<id>. */
export function BillDrawer({
  model,
  bill,
  history,
  onClose,
}: {
  model: Model;
  bill: OBill | undefined;
  history: Item[];
  onClose: () => void;
}) {
  return (
    <Sheet open={!!bill} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto bg-card p-0 sm:max-w-110">
        {bill && <DrawerBody key={bill._id} model={model} bill={bill} history={history} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ model, bill, history }: { model: Model; bill: OBill; history: Item[] }) {
  const { openBill, openInstance } = useAppActions();
  const setPaid = useMutation(api.billInstances.setPaid);
  const setArchived = useMutation(api.bills.setBillArchived);
  const [showAll, setShowAll] = useState(false);
  const profile = model.profileById.get(bill.profileId);
  const nextDue = nextDueDay(bill, history);

  const restore = async () => {
    const res = await setArchived({ id: bill._id as Id<"bills">, archived: false });
    if (res.success) toast.success("Račun je vraćen iz arhive.");
    else toast.error(res.error || "Promjena nije uspjela.");
  };

  const monthKey = toMonthKey(model.today);
  const desc = [...history].reverse();
  // The instance to act on: oldest unpaid, else this month's, else latest.
  const current =
    history.find((i) => i.status !== "paid") ??
    history.find((i) => i.dueMonth === monthKey) ??
    desc[0];
  const prev = current ? history.filter((i) => i.due < current.due).pop() : undefined;
  const last12 = history.slice(-12);
  const max = Math.max(1, ...last12.map((i) => i.amount));
  const avg = last12.length ? last12.reduce((a, i) => a + i.amount, 0) / last12.length : 0;

  const markPaid = async (i: Item) => {
    const res = await setPaid({ id: i._id, isPaid: !i.isPaid });
    if (res.success) toast.success(i.isPaid ? "Vraćeno na neplaćeno." : "Označeno kao plaćeno.");
    else toast.error(res.error || "Promjena nije uspjela.");
  };

  return (
    <div className="flex flex-col gap-5 px-6 pt-6 pb-8">
      <SheetHeader className="flex-row items-start gap-3 p-0 pr-8">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: profile?.color }} aria-hidden />
            {profile?.name}
          </p>
          <SheetTitle className="mt-1 font-display text-[32px] leading-[1.05] font-extrabold tracking-tight">
            {bill.name}
          </SheetTitle>
          <SheetDescription className="sr-only">Detalji računa, e-račun i povijest uplata</SheetDescription>
        </div>
        <Button variant="outline" size="icon" aria-label="Uredi račun" onClick={() => openBill({ billId: bill._id })}>
          <Pencil aria-hidden />
        </Button>
      </SheetHeader>

      {bill.archivedAt && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
          <Archive className="size-4 shrink-0 text-ink-2" aria-hidden />
          <p className="flex-1 text-[13px] text-ink-2">
            <b className="text-ink">Arhiviran {fullDate(new Date(bill.archivedAt))}.</b> Nove uplate se ne otvaraju,
            povijest ostaje.
          </p>
          <Button size="sm" variant="outline" onClick={() => void restore()}>
            Vrati
          </Button>
        </div>
      )}

      {current ? (
        <div className="rounded-2xl bg-ink p-4.5 text-white">
          <div className="flex items-baseline justify-between gap-2.5">
            <span className="font-mono text-xs text-[#B9BCC4] uppercase">
              {current.period ? monthLabel(current.period) : monthLabel(current.due)}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                current.status === "late" ? "bg-late-bg text-late" : current.status === "paid" ? "bg-lime text-ink" : "bg-[#3A3F47]",
              )}
            >
              {current.status === "paid" ? "Plaćeno" : current.status === "late" ? "Kasni" : "Čeka"} · {shortDate(current.due)}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 font-mono text-[34px] font-semibold tracking-tight">
            {formatMoney(current.amount)}
          </p>
          <p className="mt-0.5 text-[13px] text-[#B9BCC4]">
            {current.isEstimated && current.status !== "paid"
              ? "Procjena iz prošlog mjeseca – potvrdite iznos kad stigne račun"
              : prev && prev.amount > 0
                ? `${formatPercent(((current.amount - prev.amount) / prev.amount) * 100)} u odnosu na prošlu uplatu (${formatMoney(prev.amount)})`
                : "Prva uplata za ovaj račun"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => markPaid(current)}
              className="flex h-11 flex-[1_1_140px] items-center justify-center gap-2 rounded-xl bg-lime font-bold text-ink"
            >
              <Check className="size-4" strokeWidth={2.6} aria-hidden />
              {current.isPaid ? "Vrati na neplaćeno" : "Označi plaćeno"}
            </button>
            <button
              type="button"
              onClick={() => openInstance({ item: current })}
              className="h-11 flex-[1_1_120px] rounded-xl border border-[#3A3F47] font-semibold text-white hover:bg-[#23262D]"
            >
              Uredi iznos
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-input p-5">
          <p className="text-sm text-ink-2">Ovaj račun još nema nijednu uplatu.</p>
          <Button onClick={() => openInstance({ billId: bill._id })}>
            <Plus aria-hidden /> Dodaj uplatu
          </Button>
        </div>
      )}

      {bill.hasEBill && <EBillCard billId={bill._id} />}

      {last12.length > 1 && (
        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-bold">Zadnjih {last12.length} uplata</h3>
            <span className="text-xs text-muted-foreground">prosjek {formatMoney(avg)}</span>
          </div>
          <div className="mt-2.5 flex h-23 items-end gap-1.25 border-b border-input">
            {last12.map((i) => (
              <span
                key={i._id}
                title={`${monthShortLabel(i.due)} · ${formatMoney(i.amount)}`}
                className={cn(
                  "flex-1 rounded-t-lg",
                  i === current && i.status !== "paid" ? "border-[1.5px] border-b-0 border-dashed border-ink bg-card" : "bg-ink",
                )}
                style={{ height: `${Math.max(3, (i.amount / max) * 100)}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{monthShortLabel(last12[0].due)}</span>
            <span>{monthShortLabel(last12[last12.length - 1].due)}</span>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-bold">Uplate</h3>
          <button
            type="button"
            onClick={() => openInstance({ billId: bill._id })}
            className="py-1.5 text-[13px] font-semibold hover:underline"
          >
            + Dodaj uplatu
          </button>
        </div>
        {desc.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nema uplata.</p>
        ) : (
          <ul className="mt-1.5">
            {(showAll ? desc : desc.slice(0, 6)).map((i) => (
              <li key={i._id}>
                <button
                  type="button"
                  onClick={() => openInstance({ item: i })}
                  className="flex w-full items-center gap-3 border-b border-paper py-2.5 text-left hover:bg-[#FAFAF7]"
                >
                  <span className="w-18.5 font-mono text-[13px]">
                    {i.period ? monthShortLabel(i.period) : monthShortLabel(i.due)}
                  </span>
                  <span className="flex flex-1 items-center gap-1.5 text-xs text-muted-foreground">
                    {i.isPaid && i.paidAt
                      ? `plaćeno ${fullDate(new Date(i.paidAt))}`
                      : `dospijeće ${fullDate(i.due)}`}
                    {i.isEstimated && i.status !== "paid" && <EstimatedChip />}
                  </span>
                  <span className="font-mono font-semibold">{formatMoney(i.amount)}</span>
                  <span className="flex w-17.5 justify-end">
                    <StatusPill status={i.status} className="text-[11px]" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {desc.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="mt-1.5 py-1.5 text-[13px] font-semibold text-ink-2 hover:underline"
          >
            {showAll ? "Prikaži manje" : `Prikaži sve (${desc.length})`}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl bg-[#F6F6F2] px-4 py-3.5 text-[13px]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Ponavljanje</h3>
          <button type="button" onClick={() => openBill({ billId: bill._id })} className="text-[13px] font-semibold hover:underline">
            Uredi
          </button>
        </div>
        {bill.archivedAt ? (
          <div className="flex justify-between gap-2.5">
            <span className="text-ink-2">Nova uplata</span>
            <span className="font-semibold">ne otvara se (arhiviran)</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-2.5">
              <span className="text-ink-2">Nova uplata svakog</span>
              <span className="font-semibold">1. u mjesecu</span>
            </div>
            <div className="flex justify-between gap-2.5">
              <span className="text-ink-2">Dospijeće</span>
              <span className="text-right font-semibold">
                {nextDue.source === "bill"
                  ? `${nextDue.day}. u mjesecu`
                  : nextDue.source === "last"
                    ? `kao prošli mjesec (${nextDue.day}.)`
                    : "1. u mjesecu (nije postavljeno)"}
              </span>
            </div>
            <div className="flex justify-between gap-2.5">
              <span className="text-ink-2">Iznos</span>
              <span className="font-semibold">prepiši prošli mjesec</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EBillCard({ billId }: { billId: string }) {
  const full = useQuery(api.bills.getBill, { id: billId as Id<"bills"> });
  const [reveal, setReveal] = useState(false);
  const eBill = full?.success ? full.data?.eBill : undefined;
  if (!eBill) return null;
  const username = eBill.username ? decryptString(eBill.username) : "";
  const password = eBill.password ? decryptString(eBill.password) : "";

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} je kopirano.`);
    } catch {
      toast.error("Kopiranje nije uspjelo.");
    }
  };

  return (
    <div className="rounded-2xl border border-line px-4 py-1">
      {eBill.link && (
        <div className="flex items-center gap-2.5 border-b border-line-soft py-3">
          <span className="w-21 text-[13px] text-muted-foreground">Portal</span>
          <a
            href={eBill.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-1.5 font-semibold hover:underline"
          >
            <span className="truncate">{eBill.link.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
            <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          </a>
        </div>
      )}
      {username && (
        <div className="flex items-center gap-2.5 border-b border-line-soft py-2">
          <span className="w-21 text-[13px] text-muted-foreground">Korisnik</span>
          <span className="min-w-0 flex-1 truncate font-mono">{username}</span>
          <button
            type="button"
            onClick={() => copy(username, "Korisničko ime")}
            aria-label="Kopiraj korisničko ime"
            className="grid size-9 place-items-center rounded-lg bg-paper hover:bg-secondary"
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
      {password && (
        <div className="flex items-center gap-2.5 py-2">
          <span className="w-21 text-[13px] text-muted-foreground">Lozinka</span>
          <span className="min-w-0 flex-1 truncate font-mono tracking-wider">{reveal ? password : "••••••••••"}</span>
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Sakrij lozinku" : "Prikaži lozinku"}
            aria-pressed={reveal}
            className="grid size-9 place-items-center rounded-lg bg-paper hover:bg-secondary"
          >
            {reveal ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => copy(password, "Lozinka")}
            aria-label="Kopiraj lozinku"
            className="grid size-9 place-items-center rounded-lg bg-paper hover:bg-secondary"
          >
            <Copy className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
