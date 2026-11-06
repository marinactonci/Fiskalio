"use client";

import { useMutation } from "convex/react";
import { Check } from "lucide-react";
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
import { PROFILE_COLORS, type Model } from "@/lib/data";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Field } from "@/components/app/form";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

export interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: Model;
  profileId?: string;
  onCreated?: (profileId: string) => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  model,
  profileId,
  onCreated,
}: ProfileDialogProps) {
  const isEdit = !!profileId;
  const existing = profileId ? model.profileById.get(profileId) : undefined;

  const createProfile = useMutation(api.profiles.createProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const deleteProfile = useMutation(api.profiles.deleteProfile);

  const unusedColor =
    PROFILE_COLORS.find((c) => !model.profiles.some((p) => p.color.toLowerCase() === c.toLowerCase())) ??
    PROFILE_COLORS[0];

  const [name, setName] = useState(existing?.name ?? "");
  const [street, setStreet] = useState(existing?.address.street ?? "");
  const [city, setCity] = useState(existing?.address.city ?? "");
  const [country, setCountry] = useState(existing?.address.country || "Hrvatska");
  const [color, setColor] = useState(existing?.color ?? unusedColor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const billCount = profileId
    ? model.bills.filter((b) => b.profileId === profileId).length
    : 0;
  const instanceCount = profileId
    ? model.items.filter((i) => i.profile._id === profileId).length
    : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Upišite naziv profila.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const address = { street: street.trim(), city: city.trim(), country: country.trim() };
    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateProfile({
          id: profileId as Id<"profiles">,
          name: name.trim(),
          address,
          color,
        });
        if (!res.success) throw new Error(res.error);
        toast.success("Profil je spremljen.");
        onOpenChange(false);
      } else {
        const res = await createProfile({ name: name.trim(), address, color });
        if (!res.success || !res.data) throw new Error(res.error);
        toast.success("Profil je dodan.");
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
    if (!profileId) return;
    const res = await deleteProfile({ id: profileId as Id<"profiles"> });
    if (res.success) {
      toast.success("Profil je obrisan.");
      onOpenChange(false);
    } else toast.error(res.error || "Brisanje nije uspjelo.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            {isEdit ? "Uredi profil" : "Novi profil"}
          </DialogTitle>
          <DialogDescription>
            Za koga ili za što plaćate: stan, kuća, roditelji, poslovni prostor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="Naziv" htmlFor="prof-name" error={errors.name}>
            <Input
              id="prof-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="npr. Stan Trešnjevka"
              aria-invalid={!!errors.name}
              autoFocus={!isEdit}
            />
          </Field>
          <Field label="Ulica i broj" htmlFor="prof-street">
            <Input id="prof-street" value={street} onChange={(e) => setStreet(e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Grad" htmlFor="prof-city">
              <Input id="prof-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="Država" htmlFor="prof-country">
              <Input id="prof-country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-semibold">Boja</legend>
            <div className="flex flex-wrap items-center gap-2">
              {PROFILE_COLORS.map((c) => {
                const on = c.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Boja ${c}`}
                    aria-pressed={on}
                    className={cn(
                      "grid size-10 place-items-center rounded-full ring-offset-2 ring-offset-card transition",
                      on ? "ring-2 ring-ink" : "hover:scale-105",
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {on && <Check className="size-4 text-white" strokeWidth={3} aria-hidden />}
                  </button>
                );
              })}
              <label className="relative grid size-10 cursor-pointer place-items-center rounded-full border border-dashed border-input text-xs font-semibold text-ink-2">
                <span aria-hidden>+</span>
                <span className="sr-only">Vlastita boja</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </fieldset>

          <DialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                className="text-late hover:bg-late-bg hover:text-late sm:mr-auto"
                onClick={() => setConfirmDelete(true)}
              >
                Obriši profil
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Odustani
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Spremanje…" : isEdit ? "Spremi" : "Dodaj profil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Obrisati „${existing?.name ?? "profil"}”?`}
        description={`Trajno se brišu profil, ${billCount} ${plural(billCount, "račun", "računa", "računa")} i ${instanceCount} ${plural(instanceCount, "uplata", "uplate", "uplata")}.`}
        confirmLabel="Obriši profil"
        onConfirm={doDelete}
      />
    </Dialog>
  );
}
