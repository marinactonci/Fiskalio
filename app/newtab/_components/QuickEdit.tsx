"use client";

import { useMutation } from "convex/react";
import { Check, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EBillLink,
  ProfileDot,
  StatusPill,
  useTogglePaid,
} from "@/components/app/bits";
import { Field, amountToInput, parseAmountInput } from "@/components/app/form";
import { api } from "@/convex/_generated/api";
import type { Item } from "@/lib/data";
import { relativeDue, shortDate } from "@/lib/format";
import { focusPanel } from "./focus";

/** Side panel for one instance: mark paid, fix the amount, or open the full dialog. */
export function QuickEdit({
  item: i,
  today,
  onClose,
  onMore,
}: {
  item: Item;
  today: Date;
  onClose: () => void;
  /** Opens the full dialog; gets the typed amount when it differs from the stored one. */
  onMore: (amount?: number) => void;
}) {
  const update = useMutation(api.billInstances.updateBillInstance);
  const togglePaid = useTogglePaid();
  const titleId = useId();
  const amountId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [amount, setAmount] = useState(() => amountToInput(i.amount));
  const [serverAmount, setServerAmount] = useState(i.amount);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"amount" | "paid" | null>(null);

  // The amount can change elsewhere ("Sve opcije", another tab). Follow it
  // unless the field holds the user's own unsaved edit.
  if (i.amount !== serverAmount) {
    setServerAmount(i.amount);
    if (parseAmountInput(amount) === serverAmount)
      setAmount(amountToInput(i.amount));
  }

  useEffect(() => focusPanel(headingRef.current), []);

  const value = parseAmountInput(amount);
  const valid = Number.isFinite(value) && value >= 0;
  const changed = valid && Math.abs(value - i.amount) > 0.0001;
  // Saving an estimated amount unchanged confirms it (the server clears the flag).
  const canSave = valid && (changed || i.isEstimated);
  const paid = i.status === "paid";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError("Upišite iznos, npr. 48,60.");
      return;
    }
    if (!canSave) return;
    setBusy("amount");
    try {
      const res = await update({ id: i._id, amount: value });
      if (res.success) {
        setAmount(amountToInput(value));
        toast.success("Uplata je spremljena.");
      } else {
        toast.error(res.error || "Spremanje nije uspjelo.");
      }
    } catch {
      toast.error("Spremanje nije uspjelo. Pokušajte ponovno.");
    } finally {
      setBusy(null);
    }
  };

  const flip = async () => {
    setBusy("paid");
    try {
      await togglePaid(i);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      data-newtab-panel
      className="flex scroll-mt-4 flex-col gap-3.5 rounded-2xl border-[1.5px] border-ink bg-card p-4.5"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <ProfileDot color={i.profile.color} />
            {i.profile.name}
          </span>
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[26px] leading-[1.1] font-extrabold tracking-tight outline-none"
          >
            {i.bill.name}
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

      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <StatusPill status={i.status} />
        <span>
          Dospijeće {shortDate(i.due)}
          {!paid && ` · ${relativeDue(i.due, today)}`}
        </span>
      </div>

      <form onSubmit={save} className="flex flex-col gap-3.5" noValidate>
        <Field label="Iznos (€)" htmlFor={amountId} error={error}>
          <Input
            id={amountId}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            className="h-12 font-mono text-[22px] font-semibold md:text-[22px]"
          />
        </Field>
        {i.isEstimated && !paid && (
          <p className="rounded-[10px] border border-dashed border-[#A9ACA0] px-2.5 py-2 text-xs leading-normal text-muted-foreground">
            Iznos je prepisan iz prošlog mjeseca. Spremite stvarni iznos kad
            stigne račun.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={paid ? "outline" : "default"}
            disabled={busy !== null}
            onClick={flip}
            className="h-11.5 text-[15px] font-bold"
          >
            {!paid && (
              <Check className="text-lime" strokeWidth={3} aria-hidden />
            )}
            {paid ? "Vrati na neplaćeno" : "Označi plaćeno"}
          </Button>
          <div className="flex flex-wrap gap-2">
            {/* Invalid input stays clickable so save() can say what's wrong. */}
            <Button
              type="submit"
              variant="outline"
              disabled={busy !== null || (valid && !canSave)}
              className="flex-[1_1_120px]"
            >
              {busy === "amount"
                ? "Spremanje…"
                : i.isEstimated && !changed
                  ? "Potvrdi iznos"
                  : "Spremi iznos"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onMore(changed ? value : undefined)}
              className="flex-[1_1_120px]"
            >
              Sve opcije
            </Button>
            {i.bill.eBillLink && (
              <EBillLink
                href={i.bill.eBillLink}
                name={i.bill.name}
                className="size-11 rounded-xl"
              />
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
