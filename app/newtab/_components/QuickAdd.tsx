"use client";

import { useMutation } from "convex/react";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProfileDot } from "@/components/app/bits";
import { Field, amountToInput, parseAmountInput } from "@/components/app/form";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  billHistory,
  lastAmountFor,
  nextDueDay,
  type Model,
  type OBill,
} from "@/lib/data";
import {
  addMonths,
  parseISODate,
  periodNote,
  shortDate,
  toBillingMonth,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { focusPanel } from "./focus";

/**
 * The bill most likely meant for this day: one usually due on it (clamped to
 * the month's length, as the monthly cron does), else the first.
 */
function guessBill(model: Model, due: Date): OBill | undefined {
  const daysInMonth = new Date(
    due.getFullYear(),
    due.getMonth() + 1,
    0,
  ).getDate();
  return (
    model.activeBills.find(
      (b) =>
        Math.min(
          nextDueDay(b, billHistory(model.items, b._id)).day,
          daysInMonth,
        ) === due.getDate(),
    ) ?? model.activeBills[0]
  );
}

/**
 * Quick "add a payment on this day": pick a bill, confirm the suggested amount.
 * Billing period and note follow the same defaults as the full dialog
 * (the month before the due date); "Više opcija" opens that dialog.
 */
export function QuickAdd({
  model,
  dueDate,
  onClose,
  onAdded,
  onMore,
}: {
  model: Model;
  /** "2026-11-12" */
  dueDate: string;
  onClose: () => void;
  onAdded: (id: string) => void;
  /** Opens the full dialog with the chosen bill and, if valid, the typed amount. */
  onMore: (billId?: string, amount?: number) => void;
}) {
  const create = useMutation(api.billInstances.createBillInstance);
  const titleId = useId();
  const amountId = useId();
  const due = parseISODate(dueDate);

  const suggest = (billId: string) => {
    const last = lastAmountFor(model.items, billId);
    return last !== undefined ? amountToInput(last) : "";
  };
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => focusPanel(headingRef.current), []);
  const [billId, setBillId] = useState(() => guessBill(model, due)?._id ?? "");
  const [amount, setAmount] = useState(() => (billId ? suggest(billId) : ""));
  const [typed, setTyped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = (id: string) => {
    setBillId(id);
    if (!typed) setAmount(suggest(id));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseAmountInput(amount);
    if (!billId) return;
    if (!Number.isFinite(value) || value < 0) {
      setError("Upišite iznos, npr. 48,60.");
      return;
    }
    const period = addMonths(due, -1);
    setSaving(true);
    try {
      const res = await create({
        billId: billId as Id<"bills">,
        amount: value,
        dueDate,
        month: toBillingMonth(period),
        description: periodNote(period),
      });
      if (res.success) {
        toast.success("Uplata je dodana.");
        if (res.data) onAdded(res.data);
        else onClose();
      } else {
        toast.error(res.error || "Spremanje nije uspjelo.");
      }
    } catch {
      toast.error("Spremanje nije uspjelo. Pokušajte ponovno.");
    } finally {
      setSaving(false);
    }
  };

  const groups = model.profiles
    .map((p) => ({
      profile: p,
      bills: model.activeBills.filter((b) => b.profileId === p._id),
    }))
    .filter((g) => g.bills.length > 0);

  return (
    <section
      aria-labelledby={titleId}
      data-newtab-panel
      className="flex scroll-mt-4 flex-col gap-3.5 rounded-2xl border-[1.5px] border-ink bg-card p-4.5"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[13px] text-muted-foreground">
            Dospijeće {shortDate(due)}
          </span>
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[26px] leading-[1.1] font-extrabold tracking-tight outline-none"
          >
            Nova uplata
          </h2>
        </div>
        <button
          type="button"
          aria-label="Zatvori"
          onClick={onClose}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper hover:bg-secondary"
        >
          <X className="size-4.5" aria-hidden />
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="rounded-xl bg-paper p-3.5 text-sm text-ink-2">
            Prvo dodajte račun (npr. struja ili voda) pod Računi, a zatim mu
            možete dodavati uplate.
          </p>
          <Link
            href="/bills"
            className={buttonVariants({ variant: "outline" })}
          >
            Otvori Računi
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
          <fieldset className="flex min-w-0 flex-col gap-2.5">
            <legend className="mb-2 text-sm font-semibold text-ink">
              Račun
            </legend>
            {groups.map((g) => (
              <div
                key={g.profile._id}
                role="group"
                aria-labelledby={`${titleId}-${g.profile._id}`}
                className="flex flex-col gap-1.5"
              >
                <span
                  id={`${titleId}-${g.profile._id}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <ProfileDot color={g.profile.color} />
                  {g.profile.name}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {g.bills.map((b) => (
                    <button
                      key={b._id}
                      type="button"
                      aria-pressed={billId === b._id}
                      onClick={() => pick(b._id)}
                      className={cn(
                        "h-9 rounded-full border px-3 text-[13px] font-semibold",
                        billId === b._id
                          ? "border-ink bg-ink text-white"
                          : "border-input bg-card hover:border-ink-2",
                      )}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>

          <Field
            label="Iznos (€)"
            htmlFor={amountId}
            error={error}
            hint={
              !typed && amount
                ? "Predloženo iz zadnje uplate tog računa."
                : undefined
            }
          >
            <Input
              id={amountId}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setTyped(true);
                setError(null);
              }}
              aria-invalid={!!error}
              className="h-12 font-mono text-[22px] font-semibold md:text-[22px]"
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="h-11.5 flex-[2_1_160px] text-[15px] font-bold"
            >
              {saving ? "Spremanje…" : "Dodaj uplatu"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const value = parseAmountInput(amount);
                onMore(
                  billId || undefined,
                  Number.isFinite(value) && value >= 0 ? value : undefined,
                );
              }}
              className="h-11.5 flex-[1_1_110px]"
            >
              Više opcija
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
