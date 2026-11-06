"use client";

import { useState, type FormEvent } from "react";
import { useReverification } from "@clerk/nextjs";
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Badge,
  CodeField,
  ConfirmDialog,
  InlineError,
  SettingRow,
  Spinner,
  btn,
  copyText,
  dialogClass,
  downloadFile,
  errorText,
  reportError,
  type ClerkUser,
  type TotpResource,
} from "./shared";
import { cn } from "@/lib/utils";

export function TwoFactorSetting({ user }: { user: ClerkUser }) {
  const createTOTP = useReverification(() => user.createTOTP());
  const disableTOTP = useReverification(() => user.disableTOTP());
  const createBackupCode = useReverification(() => user.createBackupCode());

  const [setup, setSetup] = useState<TotpResource | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [busy, setBusy] = useState<"enable" | "codes" | null>(null);

  const enabled = user.totpEnabled;

  async function startSetup() {
    setBusy("enable");
    try {
      setSetup(await createTOTP());
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(null);
    }
  }

  async function regenerateCodes() {
    setBusy("codes");
    try {
      const res = await createBackupCode();
      setBackupCodes(res.codes);
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(null);
    }
  }

  async function disable() {
    try {
      await disableTOTP();
      await user.reload();
      toast.success("Dvostruka provjera je isključena.");
      return true;
    } catch (err) {
      reportError(err);
      return false;
    }
  }

  return (
    <SettingRow
      title="Dvostruka provjera"
      description="Kod iz aplikacije za autentifikaciju pri svakoj prijavi. Preporučeno jer čuvate lozinke e-računa."
    >
      {enabled ? (
        <Badge tone="lime">Uključena</Badge>
      ) : (
        <Badge tone="late">Isključena</Badge>
      )}
      {enabled ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn.outline}
            onClick={regenerateCodes}
            disabled={busy !== null}
          >
            {busy === "codes" ? <Spinner /> : null}
            Novi rezervni kodovi
          </button>
          <button
            type="button"
            className={btn.outline}
            onClick={() => setConfirmDisable(true)}
            disabled={busy !== null}
          >
            Isključi
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(btn.primary, "h-10")}
          onClick={startSetup}
          disabled={busy !== null}
        >
          {busy === "enable" ? <Spinner /> : null}
          Uključi
        </button>
      )}

      <Dialog
        open={setup !== null}
        onOpenChange={(open) => !open && setSetup(null)}
      >
        <DialogContent className={dialogClass} showCloseButton={false}>
          {setup ? (
            <TotpSetup
              user={user}
              totp={setup}
              onClose={() => setSetup(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={backupCodes !== null}
        onOpenChange={(open) => !open && setBackupCodes(null)}
      >
        <DialogContent className={dialogClass} showCloseButton={false}>
          {backupCodes ? (
            <BackupCodes
              codes={backupCodes}
              onClose={() => setBackupCodes(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        title="Isključiti dvostruku provjeru?"
        description="Za prijavu će vam ponovno biti dovoljna samo lozinka. Rezervni kodovi prestat će vrijediti."
        confirmLabel="Isključi"
        pendingLabel="Isključivanje…"
        destructive
        onConfirm={disable}
      />
    </SettingRow>
  );
}

function TotpSetup({
  user,
  totp,
  onClose,
}: {
  user: ClerkUser;
  totp: TotpResource;
  onClose: () => void;
}) {
  const verifyTOTP = useReverification((code: string) =>
    user.verifyTOTP({ code }),
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const secret = totp.secret ?? "";
  const groupedSecret = secret.match(/.{1,4}/g)?.join(" ") ?? secret;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await verifyTOTP(code.trim());
      await user.reload();
      toast.success("Dvostruka provjera je uključena.");
      if (res.backupCodes?.length) setBackupCodes(res.backupCodes);
      else onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (backupCodes) return <BackupCodes codes={backupCodes} onClose={onClose} />;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-display text-xl font-bold text-ink">
          Uključite dvostruku provjeru
        </DialogTitle>
        <DialogDescription>
          Treba vam aplikacija za autentifikaciju, npr. Google Authenticator,
          Microsoft Authenticator ili 1Password.
        </DialogDescription>
      </DialogHeader>

      <ol className="flex flex-col gap-4 text-sm text-ink">
        <li className="flex flex-col gap-2">
          <span>
            <span className="font-semibold">1.</span> Dodajte Fiskalio u
            aplikaciju.
          </span>
          {totp.uri ? (
            <a href={totp.uri} className={cn(btn.outline, "self-start")}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Otvori u aplikaciji za autentifikaciju
            </a>
          ) : null}
          {secret ? (
            <>
              <span className="text-[13px] text-muted-foreground">
                Ili u aplikaciji odaberite ručni unos i upišite ovaj ključ:
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-line bg-paper py-1.5 pr-1.5 pl-3">
                <code className="min-w-0 flex-1 font-mono text-sm break-all text-ink">
                  {groupedSecret}
                </code>
                <button
                  type="button"
                  className={btn.icon}
                  onClick={() => copyText(secret, "Ključ je kopiran.")}
                  aria-label="Kopiraj ključ"
                >
                  <Copy className="size-4" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : null}
        </li>
        <li className="flex flex-col gap-2">
          <span>
            <span className="font-semibold">2.</span> Upišite šesteroznamenkasti
            kod koji aplikacija prikazuje.
          </span>
          <CodeField
            id="totp-code"
            label="Kod iz aplikacije"
            value={code}
            onChange={setCode}
          />
        </li>
      </ol>

      <InlineError message={error} />
      <DialogFooter className="gap-2">
        <button type="button" className={btn.ghost} onClick={onClose}>
          Odustani
        </button>
        <button
          type="submit"
          className={btn.primary}
          disabled={busy || code.length < 6}
        >
          {busy ? <Spinner /> : null}
          Uključi
        </button>
      </DialogFooter>
    </form>
  );
}

function BackupCodes({
  codes,
  onClose,
}: {
  codes: string[];
  onClose: () => void;
}) {
  const text = codes.join("\n");
  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-display text-xl font-bold text-ink">
          Spremite rezervne kodove
        </DialogTitle>
        <DialogDescription>
          Svaki kod vrijedi jednom, za prijavu kad nemate pristup aplikaciji za
          autentifikaciju. Spremite ih na sigurno mjesto – nakon zatvaranja ovog
          prozora više se neće prikazati.
        </DialogDescription>
      </DialogHeader>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-line bg-paper p-4 font-mono text-sm text-ink">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={btn.outline}
          onClick={() => copyText(text, "Kodovi su kopirani.")}
        >
          <Copy className="size-4" aria-hidden="true" />
          Kopiraj
        </button>
        <button
          type="button"
          className={btn.outline}
          onClick={() =>
            downloadFile(
              "fiskalio-rezervni-kodovi.txt",
              `Fiskalio – rezervni kodovi\n\n${text}\n`,
              "text/plain;charset=utf-8",
            )
          }
        >
          <Download className="size-4" aria-hidden="true" />
          Preuzmi .txt
        </button>
      </div>
      <DialogFooter>
        <button type="button" className={btn.primary} onClick={onClose}>
          Gotovo
        </button>
      </DialogFooter>
    </div>
  );
}
