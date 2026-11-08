"use client";

import { useMutation } from "convex/react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { lastAmountFor, type Item, type Model } from "@/lib/data";
import {
  addMonths,
  fullDate,
  parseISODate,
  periodNote,
  toBillingMonth,
  toISODate,
  toMonthKey,
  parseMonthKey,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Field,
  amountToInput,
  parseAmountInput,
  selectClass,
  textareaClass,
} from "@/components/app/form";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DatePicker, MonthField } from "@/components/app/DatePicker";

export interface InstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: Model;
  /** Edit an existing instance… */
  item?: Item;
  /** …or create a new one with these defaults. */
  billId?: string;
  dueDate?: string;
  /** Amount to start with instead of the stored/last one (typed in a quick panel). */
  amount?: number;
}

/** Generated note for a "yyyy-MM" period key ("" if the key is invalid). */
function autoNote(periodKey: string): string {
  const d = parseMonthKey(periodKey);
  return d ? periodNote(d) : "";
}

export function InstanceDialog({
  open,
  onOpenChange,
  model,
  item,
  billId: defaultBillId,
  dueDate: defaultDue,
  amount: amountOverride,
}: InstanceDialogProps) {
  const isEdit = !!item;
  const create = useMutation(api.billInstances.createBillInstance);
  const update = useMutation(api.billInstances.updateBillInstance);
  const remove = useMutation(api.billInstances.deleteBillInstance);

  const initialBill =
    item?.bill._id ?? defaultBillId ?? model.activeBills[0]?._id ?? model.bills[0]?._id ?? "";
  const initialDue = item?.dueDate ?? defaultDue ?? toISODate(new Date());
  const initialPeriod = item?.period
    ? toMonthKey(item.period)
    : toMonthKey(addMonths(parseISODate(initialDue), -1));
  const prefill =
    amountOverride ?? item?.amount ?? (initialBill ? lastAmountFor(model.items, initialBill) : undefined);
  // Older instances may be paid without a recorded date.
  const legacyPaid = !!item?.isPaid && !item?.paidAt;

  const [billId, setBillId] = useState<string>(initialBill);
  const [amount, setAmount] = useState(prefill !== undefined ? amountToInput(prefill) : "");
  const [dueDate, setDueDate] = useState(initialDue);
  const [period, setPeriod] = useState(initialPeriod);
  const [periodTouched, setPeriodTouched] = useState(isEdit);
  const [note, setNote] = useState(item?.description || autoNote(initialPeriod));
  const [paidDate, setPaidDate] = useState(item?.paidAt ? toISODate(new Date(item.paidAt)) : "");
  const [paidTouched, setPaidTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showLegacyPaid = legacyPaid && !paidTouched;
  const isPaidNow = !!paidDate || showLegacyPaid;
  const generatedNote = autoNote(period);

  const onBillChange = (id: string) => {
    setBillId(id);
    if (!isEdit && !amount) {
      const last = lastAmountFor(model.items, id);
      if (last !== undefined) setAmount(amountToInput(last));
    }
  };

  /** Changes the period and keeps an untouched generated note in step with it. */
  const changePeriod = (next: string) => {
    setNote((n) => (!n.trim() || n === autoNote(period) ? autoNote(next) : n));
    setPeriod(next);
  };

  const onDueChange = (v: string) => {
    setDueDate(v);
    if (!periodTouched && v) changePeriod(toMonthKey(addMonths(parseISODate(v), -1)));
  };

  const changePaid = (v: string) => {
    setPaidDate(v);
    setPaidTouched(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseAmountInput(amount);
    const errs: Record<string, string> = {};
    if (!billId) errs.bill = "Odaberite račun.";
    if (!Number.isFinite(value) || value < 0) errs.amount = "Upišite iznos, npr. 48,60.";
    if (!dueDate) errs.due = "Odaberite datum dospijeća.";
    const periodDate = parseMonthKey(period);
    if (!periodDate) errs.period = "Odaberite mjesec.";
    setErrors(errs);
    if (Object.keys(errs).length || !periodDate) return;

    // Stored as local midnight of the chosen day.
    const paidAt = paidDate ? parseISODate(paidDate).getTime() : undefined;

    setSaving(true);
    try {
      const res = isEdit
        ? await update({
            id: item!._id,
            amount: value !== item!.amount || item!.isEstimated ? value : undefined,
            dueDate,
            month: toBillingMonth(periodDate),
            description: note.trim(),
            // Only touch payment when the field was changed, so a precise
            // timestamp from the quick toggle is kept otherwise.
            paidAt: paidTouched ? (paidAt ?? null) : undefined,
          })
        : await create({
            billId: billId as Id<"bills">,
            amount: value,
            dueDate,
            month: toBillingMonth(periodDate),
            description: note.trim() || undefined,
            paidAt,
          });
      if (res.success) {
        toast.success(isEdit ? "Uplata je spremljena." : "Uplata je dodana.");
        onOpenChange(false);
      } else {
        toast.error(res.error || "Spremanje nije uspjelo.");
      }
    } catch {
      toast.error("Spremanje nije uspjelo. Pokušajte ponovno.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!item) return;
    const res = await remove({ id: item._id });
    if (res.success) {
      toast.success("Uplata je obrisana.");
      onOpenChange(false);
    } else toast.error(res.error || "Brisanje nije uspjelo.");
  };

  const bill = model.billById.get(billId);
  const profile = bill ? model.profileById.get(bill.profileId) : undefined;
  // New instances go to active bills; an archived bill is offered only when
  // the dialog was opened for it (e.g. from its detail panel).
  const pickable = model.bills.filter((b) => !b.archivedAt || b._id === initialBill);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            {isEdit ? `${item!.bill.name}` : "Nova uplata"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `${item!.profile.name} · uredite iznos, datume ili bilješku.`
              : "Jedna mjesečna uplata za odabrani račun."}
          </DialogDescription>
        </DialogHeader>

        {model.bills.length === 0 ? (
          <p className="rounded-xl bg-paper p-4 text-sm text-ink-2">
            Prvo dodajte račun (npr. struja ili voda) pod Računi, a zatim mu
            možete dodavati uplate.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            {isEdit && item!.isEstimated && (
              <p className="rounded-xl border border-dashed border-input bg-paper px-3.5 py-2.5 text-sm text-ink-2">
                Iznos je prepisan iz prošlog mjeseca. Spremite stvarni iznos
                kad stigne račun.
              </p>
            )}

            {!isEdit && (
              <Field label="Račun" htmlFor="inst-bill" error={errors.bill}>
                <select
                  id="inst-bill"
                  className={selectClass}
                  value={billId}
                  onChange={(e) => onBillChange(e.target.value)}
                >
                  {model.profiles.map((p) => {
                    const bills = pickable.filter((b) => b.profileId === p._id);
                    if (!bills.length) return null;
                    return (
                      <optgroup key={p._id} label={p.name}>
                        {bills.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                            {b.archivedAt ? " (arhiviran)" : ""}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </Field>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Iznos (€)" htmlFor="inst-amount" error={errors.amount}>
                <Input
                  id="inst-amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-mono"
                  aria-invalid={!!errors.amount}
                />
              </Field>
              <Field label="Dospijeće" htmlFor="inst-due" error={errors.due}>
                <DatePicker
                  id="inst-due"
                  value={dueDate}
                  onChange={onDueChange}
                  invalid={!!errors.due}
                />
              </Field>
            </div>

            <Field
              label="Razdoblje računa"
              htmlFor="inst-period"
              hint="Mjesec na koji se račun odnosi."
              error={errors.period}
            >
              <MonthField
                id="inst-period"
                value={period}
                onChange={(v) => {
                  changePeriod(v);
                  setPeriodTouched(true);
                }}
                invalid={!!errors.period}
              />
            </Field>

            <div
              className={cn(
                "flex flex-col gap-1.5 rounded-xl px-3.5 py-3",
                isPaidNow ? "bg-lime-soft" : "bg-paper",
              )}
            >
              <label htmlFor="inst-paid" className="text-sm font-semibold text-ink">
                Datum plaćanja
              </label>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <DatePicker
                    id="inst-paid"
                    value={paidDate}
                    onChange={changePaid}
                    placeholder={showLegacyPaid ? "Plaćeno (bez datuma)" : "Nije plaćeno"}
                  />
                </div>
                {paidDate ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-11 shrink-0 rounded-xl bg-card"
                    aria-label="Ukloni datum plaćanja"
                    onClick={() => changePaid("")}
                  >
                    <X aria-hidden />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-11 shrink-0 rounded-xl bg-lime font-bold text-ink hover:bg-[#c6e85a]"
                    onClick={() => changePaid(toISODate(new Date()))}
                  >
                    <Check strokeWidth={2.8} aria-hidden /> Danas
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {paidDate ? (
                  `Plaćeno ${fullDate(parseISODate(paidDate))} Uklonite datum za povratak na neplaćeno.`
                ) : showLegacyPaid ? (
                  <>
                    Označeno kao plaćeno, ali datum nije zabilježen.{" "}
                    <button
                      type="button"
                      onClick={() => setPaidTouched(true)}
                      className="font-semibold text-ink underline-offset-2 hover:underline"
                    >
                      Vrati na neplaćeno
                    </button>
                  </>
                ) : (
                  "Odaberite datum ili kliknite Danas."
                )}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="inst-note" className="text-sm font-semibold text-ink">
                Bilješka
              </label>
              <textarea
                id="inst-note"
                className={textareaClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="npr. broj računa, poziv na broj…"
              />
              {generatedNote && note.trim() !== generatedNote ? (
                <button
                  type="button"
                  onClick={() => setNote(generatedNote)}
                  className="self-start text-left text-xs font-semibold text-ink underline-offset-2 hover:underline"
                >
                  {note.trim() ? "Zamijeni tekstom iz razdoblja" : "Popuni iz razdoblja"}
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Popunjava se iz razdoblja računa.
                </p>
              )}
            </div>

            <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:items-center">
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-late hover:bg-late-bg hover:text-late sm:mr-auto"
                  onClick={() => setConfirmDelete(true)}
                >
                  Obriši
                </Button>
              )}
              {bill && profile && isEdit && (
                <Link
                  href={`/bills?bill=${bill._id}`}
                  onClick={() => onOpenChange(false)}
                  className="px-2 text-center text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Otvori račun
                </Link>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Spremanje…" : isEdit ? "Spremi" : "Dodaj uplatu"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Obrisati uplatu?"
        description="Uplata će se trajno ukloniti iz kalendara i statistike."
        confirmLabel="Obriši uplatu"
        onConfirm={doDelete}
      />
    </Dialog>
  );
}
