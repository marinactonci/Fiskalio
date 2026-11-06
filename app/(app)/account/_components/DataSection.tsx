"use client";

import { useState, type FormEvent } from "react";
import { useReverification } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Field,
  InlineError,
  SettingsCard,
  Spinner,
  TextInput,
  btn,
  dialogClass,
  downloadFile,
  errorText,
  type ClerkUser,
} from "./shared";

type ExportRow = {
  billName: string;
  profileName: string;
  month: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  description?: string;
};

const CONFIRM_WORDS = ["OBRIŠI", "OBRISI"];

/** "1 uplata", "2 uplate", "5 uplata", "22 uplate"… */
function paymentsLabel(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  const few = last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14);
  return `${n} ${few ? "uplate" : "uplata"}`;
}

/**
 * Semicolon-separated with decimal commas, which is what Excel expects under a
 * Croatian locale. Text cells that start like a formula are prefixed with an
 * apostrophe so spreadsheet apps don't evaluate them.
 */
function textCell(value: string) {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  if (/[";\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

function buildCsv(rows: ExportRow[]) {
  const header = [
    "Profil",
    "Račun",
    "Mjesec",
    "Dospijeće",
    "Iznos (EUR)",
    "Plaćeno",
    "Opis",
  ].join(";");
  const sorted = [...rows].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.profileName.localeCompare(b.profileName, "hr") ||
      a.billName.localeCompare(b.billName, "hr"),
  );
  const lines = sorted.map((r) =>
    [
      textCell(r.profileName),
      textCell(r.billName),
      textCell(r.month),
      textCell(r.dueDate),
      r.amount.toFixed(2).replace(".", ","),
      r.isPaid ? "da" : "ne",
      textCell(r.description ?? ""),
    ].join(";"),
  );
  return [header, ...lines].join("\r\n");
}

export function DataSection({ user }: { user: ClerkUser }) {
  const result = useQuery(api.billInstances.getAllBillInstancesWithBillNames);
  const rows: ExportRow[] = result?.data ?? [];
  const loading = result === undefined;
  const failed = result !== undefined && !result.success;
  const [deleteOpen, setDeleteOpen] = useState(false);

  function exportCsv() {
    downloadFile(
      "fiskalio-uplate.csv",
      `﻿${buildCsv(rows)}\r\n`,
      "text/csv;charset=utf-8",
    );
    toast.success("CSV je preuzet.");
  }

  let exportDescription: string;
  if (loading) exportDescription = "Pripremamo vaše podatke…";
  else if (failed)
    exportDescription = "Podaci za izvoz trenutačno nisu dostupni.";
  else if (rows.length === 0) exportDescription = "Još nemate uplata za izvoz.";
  else
    exportDescription = `${paymentsLabel(rows.length)} s nazivima računa i profila, kao CSV. Lozinke e-računa se ne izvoze.`;

  return (
    <SettingsCard id="podaci" title="Podaci i privatnost">
      <div className="mt-3.5 flex flex-wrap items-center gap-3.5 border-b border-line-soft pb-[18px]">
        <div className="min-w-0 flex-[1_1_240px]">
          <p className="font-semibold text-ink">Izvoz podataka</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {exportDescription}
          </p>
        </div>
        <button
          type="button"
          className={btn.outline}
          onClick={exportCsv}
          disabled={loading || failed || rows.length === 0}
        >
          {loading ? (
            <Spinner />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          Preuzmi CSV
        </button>
      </div>

      <div className="mt-[18px] flex flex-wrap items-center gap-3.5 rounded-xl border-[1.5px] border-late-border bg-late-bg/50 p-[18px]">
        <div className="min-w-0 flex-[1_1_240px]">
          <p className="font-bold text-late-strong">Obriši račun</p>
          <p className="mt-0.5 text-[13px] text-late-strong/90">
            {user.deleteSelfEnabled
              ? "Trajno briše vaš korisnički račun, sve profile, račune i uplate te vas odjavljuje sa svih uređaja. Ovo se ne može poništiti."
              : "Brisanje računa trenutačno nije omogućeno. Javite nam se ako ga želite obrisati."}
          </p>
        </div>
        <button
          type="button"
          className={btn.danger}
          onClick={() => setDeleteOpen(true)}
          disabled={!user.deleteSelfEnabled}
        >
          Obriši račun…
        </button>
      </div>

      <DeleteAccountDialog
        user={user}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </SettingsCard>
  );
}

function DeleteAccountDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ClerkUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const wipeData = useMutation(api.profiles.deleteAllMyData);
  // Convex data goes first: once the Clerk user is gone the session can no
  // longer authenticate to Convex. The wipe is idempotent, so a retry after
  // Clerk's re-verification prompt is harmless.
  const deleteUser = useReverification(async () => {
    const res = await wipeData();
    if (!res.success) throw new Error(res.error || "Brisanje podataka nije uspjelo.");
    return user.delete();
  });
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = CONFIRM_WORDS.includes(value.trim().toUpperCase());

  function change(next: boolean) {
    if (busy) return;
    if (!next) {
      setValue("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await deleteUser();
      toast.success("Račun je obrisan.");
      window.location.assign("/");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={change}>
      <AlertDialogContent className={dialogClass}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-bold text-ink">
              Obrisati račun?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Račun {user.primaryEmailAddress?.emailAddress ?? ""} bit će trajno
              obrisan zajedno sa svim profilima, računima i uplatama, a
              odjavit ćemo vas sa svih uređaja. Ovo se ne može poništiti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field id="delete-confirm" label="Za potvrdu upišite OBRIŠI">
            <TextInput
              id="delete-confirm"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </Field>
          <InlineError message={error} />
          <AlertDialogFooter className="gap-2">
            <button
              type="button"
              className={btn.ghost}
              onClick={() => change(false)}
              disabled={busy}
            >
              Odustani
            </button>
            <button
              type="submit"
              className={btn.danger}
              disabled={!confirmed || busy}
            >
              {busy ? <Spinner /> : null}
              Trajno obriši račun
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
