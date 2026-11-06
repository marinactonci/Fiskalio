"use client";

import { useMutation } from "convex/react";
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
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Item, Model } from "@/lib/data";
import {
  addMonths,
  parseISODate,
  toBillingMonth,
  toISODate,
  toMonthKey,
  parseMonthKey,
} from "@/lib/format";
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
}

function lastAmountFor(model: Model, billId: string): number | undefined {
  const hist = model.items.filter((i) => i.bill._id === billId);
  return hist.length ? hist[hist.length - 1].amount : undefined;
}

export function InstanceDialog({
  open,
  onOpenChange,
  model,
  item,
  billId: defaultBillId,
  dueDate: defaultDue,
}: InstanceDialogProps) {
  const isEdit = !!item;
  const create = useMutation(api.billInstances.createBillInstance);
  const update = useMutation(api.billInstances.updateBillInstance);
  const remove = useMutation(api.billInstances.deleteBillInstance);

  const initialBill = item?.bill._id ?? defaultBillId ?? model.bills[0]?._id ?? "";
  const initialDue = item?.dueDate ?? defaultDue ?? toISODate(new Date());
  const initialPeriod = item?.period
    ? toMonthKey(item.period)
    : toMonthKey(addMonths(parseISODate(initialDue), -1));
  const prefill = item?.amount ?? (initialBill ? lastAmountFor(model, initialBill) : undefined);

  const [billId, setBillId] = useState<string>(initialBill);
  const [amount, setAmount] = useState(prefill !== undefined ? amountToInput(prefill) : "");
  const [dueDate, setDueDate] = useState(initialDue);
  const [period, setPeriod] = useState(initialPeriod);
  const [periodTouched, setPeriodTouched] = useState(isEdit);
  const [note, setNote] = useState(item?.description ?? "");
  const [isPaid, setIsPaid] = useState(item?.isPaid ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onBillChange = (id: string) => {
    setBillId(id);
    if (!isEdit && !amount) {
      const last = lastAmountFor(model, id);
      if (last !== undefined) setAmount(amountToInput(last));
    }
  };

  const onDueChange = (v: string) => {
    setDueDate(v);
    if (!periodTouched && v) setPeriod(toMonthKey(addMonths(parseISODate(v), -1)));
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

    setSaving(true);
    try {
      const res = isEdit
        ? await update({
            id: item!._id,
            amount: value !== item!.amount || item!.isEstimated ? value : undefined,
            dueDate,
            month: toBillingMonth(periodDate),
            description: note.trim(),
            isPaid,
          })
        : await create({
            billId: billId as Id<"bills">,
            amount: value,
            dueDate,
            month: toBillingMonth(periodDate),
            description: note.trim() || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            {isEdit ? `${item!.bill.name}` : "Nova uplata"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `${item!.profile.name} · uredite iznos, datum ili status.`
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
                    const bills = model.bills.filter((b) => b.profileId === p._id);
                    if (!bills.length) return null;
                    return (
                      <optgroup key={p._id} label={p.name}>
                        {bills.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
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
                  setPeriod(v);
                  setPeriodTouched(true);
                }}
                invalid={!!errors.period}
              />
            </Field>

            <Field label="Bilješka (nije obavezno)" htmlFor="inst-note">
              <textarea
                id="inst-note"
                className={textareaClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="npr. broj računa, poziv na broj…"
              />
            </Field>

            {isEdit && (
              <label className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3.5 py-3">
                <span className="text-sm font-semibold">Plaćeno</span>
                <Switch checked={isPaid} onCheckedChange={setIsPaid} />
              </label>
            )}

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
