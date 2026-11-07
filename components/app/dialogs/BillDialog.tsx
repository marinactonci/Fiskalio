"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
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
import type { Model } from "@/lib/data";
import { decryptString, encryptString } from "@/lib/utils";
import { plural } from "@/lib/format";
import { Field, selectClass } from "@/components/app/form";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export interface BillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: Model;
  billId?: string;
  profileId?: string;
  onCreated?: (billId: string) => void;
  onDeleted?: () => void;
}

export function BillDialog({
  open,
  onOpenChange,
  model,
  billId,
  profileId: defaultProfile,
  onCreated,
  onDeleted,
}: BillDialogProps) {
  const isEdit = !!billId;
  const existing = billId ? model.billById.get(billId) : undefined;
  const full = useQuery(
    api.bills.getBill,
    billId ? { id: billId as Id<"bills"> } : "skip",
  );

  const createBill = useMutation(api.bills.createBillForProfile);
  const updateBill = useMutation(api.bills.updateBill);
  const deleteBill = useMutation(api.bills.deleteBill);
  const setArchived = useMutation(api.bills.setBillArchived);
  const isArchived = !!existing?.archivedAt;

  const [name, setName] = useState(existing?.name ?? "");
  const [profileId, setProfileId] = useState<string>(
    existing?.profileId ?? defaultProfile ?? model.profiles[0]?._id ?? "",
  );
  const [dueDay, setDueDay] = useState(existing?.dueDay ? String(existing.dueDay) : "");
  const [link, setLink] = useState(existing?.eBillLink ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadedSecrets, setLoadedSecrets] = useState(!isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  // Prefill decrypted e-bill credentials once the full bill has loaded.
  useEffect(() => {
    if (loadedSecrets || !full) return;
    if (full.success && full.data?.eBill) {
      setLink(full.data.eBill.link || "");
      setUsername(full.data.eBill.username ? decryptString(full.data.eBill.username) : "");
      setPassword(full.data.eBill.password ? decryptString(full.data.eBill.password) : "");
    }
    setLoadedSecrets(true);
  }, [full, loadedSecrets]);

  const instanceCount = billId
    ? model.items.filter((i) => i.bill._id === billId).length
    : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Upišite naziv računa.";
    if (!profileId) errs.profile = "Odaberite profil.";
    const day = dueDay.trim() ? Number(dueDay) : undefined;
    if (day !== undefined && (!Number.isInteger(day) || day < 1 || day > 31))
      errs.dueDay = "Dan mora biti između 1 i 31.";
    if (link.trim() && !/^https?:\/\/\S+$/i.test(link.trim()))
      errs.link = "Poveznica mora počinjati s https://";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const hasEBill = !!(link.trim() || username || password);
    const eBill = hasEBill
      ? {
          link: link.trim(),
          username: username ? encryptString(username) : "",
          password: password ? encryptString(password) : "",
        }
      : undefined;

    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateBill({
          id: billId as Id<"bills">,
          name: name.trim(),
          profileId: profileId as Id<"profiles">,
          dueDay: day,
          eBill,
          removeEBill: !hasEBill,
        });
        if (!res.success) throw new Error(res.error);
        toast.success("Račun je spremljen.");
        onOpenChange(false);
      } else {
        const res = await createBill({
          profileId: profileId as Id<"profiles">,
          name: name.trim(),
          dueDay: day,
          eBill,
        });
        if (!res.success || !res.data) throw new Error(res.error);
        toast.success("Račun je dodan.");
        onOpenChange(false);
        onCreated?.(res.data);
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Spremanje nije uspjelo.");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!billId) return;
    const res = await deleteBill({ id: billId as Id<"bills"> });
    if (res.success) {
      toast.success("Račun i njegove uplate su obrisani.");
      onOpenChange(false);
      onDeleted?.();
    } else toast.error(res.error || "Brisanje nije uspjelo.");
  };

  const doArchive = async (archived: boolean) => {
    if (!billId) return;
    const res = await setArchived({ id: billId as Id<"bills">, archived });
    if (res.success) {
      toast.success(
        archived
          ? "Račun je arhiviran. Povijest uplata ostaje."
          : "Račun je vraćen iz arhive.",
      );
      onOpenChange(false);
    } else toast.error(res.error || "Promjena nije uspjela.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            {isEdit ? "Uredi račun" : "Novi račun"}
          </DialogTitle>
          <DialogDescription>
            Obveza koja se ponavlja svaki mjesec – struja, voda, internet,
            pričuva…
          </DialogDescription>
        </DialogHeader>

        {model.profiles.length === 0 ? (
          <p className="rounded-xl bg-paper p-4 text-sm text-ink-2">
            Račun pripada profilu (stan, kuća, osoba). Prvo dodajte profil.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field label="Naziv" htmlFor="bill-name" error={errors.name}>
              <Input
                id="bill-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="npr. HEP struja"
                aria-invalid={!!errors.name}
                autoFocus={!isEdit}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_150px]">
              <Field label="Profil" htmlFor="bill-profile" error={errors.profile}>
                <select
                  id="bill-profile"
                  className={selectClass}
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                >
                  {model.profiles.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Dan dospijeća" htmlFor="bill-due" error={errors.dueDay}>
                <Input
                  id="bill-due"
                  inputMode="numeric"
                  placeholder="1–31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  aria-invalid={!!errors.dueDay}
                />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              {isArchived
                ? "Račun je arhiviran – nove uplate se više ne otvaraju."
                : "Prvog u mjesecu Fiskalio otvara novu uplatu s prošlomjesečnim iznosom i danom dospijeća. Upišite dan samo ako želite da uvijek bude isti."}
            </p>

            <fieldset className="flex flex-col gap-3 rounded-2xl border border-line p-4">
              <legend className="px-1 text-sm font-semibold">E-račun (nije obavezno)</legend>
              <Field label="Poveznica na portal" htmlFor="bill-link" error={errors.link}>
                <Input
                  id="bill-link"
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  aria-invalid={!!errors.link}
                />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Korisničko ime" htmlFor="bill-user">
                  <Input
                    id="bill-user"
                    autoComplete="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={!loadedSecrets}
                  />
                </Field>
                <Field label="Lozinka" htmlFor="bill-pass">
                  <Input
                    id="bill-pass"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!loadedSecrets}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Korisničko ime i lozinka spremaju se šifrirano.
              </p>
            </fieldset>

            <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:items-center">
              {isEdit && (
                <div className="flex gap-1 sm:mr-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 sm:flex-none"
                    onClick={() => (isArchived ? void doArchive(false) : setConfirmArchive(true))}
                  >
                    {isArchived ? "Vrati iz arhive" : "Arhiviraj"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-late hover:bg-late-bg hover:text-late sm:flex-none"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Obriši
                  </Button>
                </div>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Odustani
              </Button>
              <Button type="submit" disabled={saving || !loadedSecrets}>
                {saving ? "Spremanje…" : isEdit ? "Spremi" : "Dodaj račun"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Obrisati „${existing?.name ?? "račun"}”?`}
        description={
          isArchived
            ? `Trajno se brišu račun i ${instanceCount} ${plural(instanceCount, "uplata", "uplate", "uplata")} povezanih s njim. Nestat će i iz kalendara i statistike.`
            : `Trajno se brišu račun i ${instanceCount} ${plural(instanceCount, "uplata", "uplate", "uplata")} povezanih s njim. Ako se račun samo mijenja ili gasi, arhivirajte ga – povijest ostaje.`
        }
        confirmLabel="Obriši trajno"
        onConfirm={doDelete}
        secondaryLabel={isArchived ? undefined : "Arhiviraj umjesto toga"}
        onSecondary={isArchived ? undefined : () => doArchive(true)}
      />
      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        tone="default"
        title={`Arhivirati „${existing?.name ?? "račun"}”?`}
        description={`Od idućeg mjeseca više se neće otvarati nove uplate. ${
          instanceCount === 0
            ? ""
            : instanceCount === 1
              ? "Postojeća uplata ostaje u kalendaru i statistici. "
              : `Svih ${instanceCount} ${plural(instanceCount, "uplata", "uplate", "uplata")} ostaje u kalendaru i statistici, a neplaćene i dalje čekaju na popisu. `
        }Račun možete vratiti iz arhive bilo kada.`}
        confirmLabel="Arhiviraj"
        onConfirm={() => doArchive(true)}
      />
    </Dialog>
  );
}
