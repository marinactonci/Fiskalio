"use client";

import { useState, type FormEvent } from "react";
import { useReverification } from "@clerk/nextjs";
import { Check, Plus, X } from "lucide-react";
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
  Field,
  InlineError,
  Spinner,
  TextInput,
  btn,
  dialogClass,
  errorText,
  reportError,
  type ClerkUser,
  type EmailAddress,
} from "./shared";

export function EmailAddresses({ user }: { user: ClerkUser }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<EmailAddress | null>(null);
  // Kept after closing so the dialog text doesn't blank during its exit animation.
  const [toRemove, setToRemove] = useState<EmailAddress | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setPrimary = useReverification((id: string) =>
    user.update({ primaryEmailAddressId: id }),
  );
  const destroyEmail = useReverification((email: EmailAddress) =>
    email.destroy(),
  );

  const emails = [...user.emailAddresses].sort((a, b) => {
    if (a.id === user.primaryEmailAddressId) return -1;
    if (b.id === user.primaryEmailAddressId) return 1;
    return 0;
  });

  function openAdd() {
    setVerifyTarget(null);
    setDialogOpen(true);
  }

  async function sendCode(email: EmailAddress) {
    setBusyId(email.id);
    try {
      await email.prepareVerification({ strategy: "email_code" });
      setVerifyTarget(email);
      setDialogOpen(true);
    } catch (err) {
      reportError(err);
    } finally {
      setBusyId(null);
    }
  }

  async function makePrimary(email: EmailAddress) {
    setBusyId(email.id);
    try {
      await setPrimary(email.id);
      toast.success(`${email.emailAddress} je sada primarna adresa.`);
    } catch (err) {
      reportError(err);
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    if (!toRemove) return true;
    try {
      await destroyEmail(toRemove);
      await user.reload();
      toast.success("Adresa e-pošte je uklonjena.");
      return true;
    } catch (err) {
      reportError(err);
      return false;
    }
  }

  return (
    <div className="mt-6">
      <p className="mb-2 text-[13px] font-semibold text-ink">Adrese e-pošte</p>
      <ul className="rounded-xl border border-line">
        {emails.map((email) => {
          const primary = email.id === user.primaryEmailAddressId;
          const verified = email.verification.status === "verified";
          const busy = busyId === email.id;
          return (
            <li
              key={email.id}
              className="flex flex-wrap items-center gap-2.5 border-b border-line-soft px-3.5 py-3 last:border-b-0"
            >
              <span className="min-w-0 font-medium break-all text-ink">
                {email.emailAddress}
              </span>
              {primary ? <Badge tone="ink">PRIMARNA</Badge> : null}
              {verified ? (
                <span className="flex items-center gap-1 text-xs text-ink-2">
                  <Check
                    className="size-3.5"
                    strokeWidth={2.6}
                    aria-hidden="true"
                  />
                  potvrđena
                </span>
              ) : (
                <span className="text-xs font-semibold text-late">
                  nije potvrđena
                </span>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                {busy ? <Spinner className="text-muted-foreground" /> : null}
                {!verified ? (
                  <button
                    type="button"
                    className={btn.small}
                    onClick={() => sendCode(email)}
                    disabled={busy}
                  >
                    Pošalji kod
                  </button>
                ) : null}
                {verified && !primary ? (
                  <button
                    type="button"
                    className={btn.small}
                    onClick={() => makePrimary(email)}
                    disabled={busy}
                  >
                    Postavi kao primarnu
                  </button>
                ) : null}
                {!primary ? (
                  <button
                    type="button"
                    className={btn.icon}
                    onClick={() => {
                      setToRemove(email);
                      setRemoveOpen(true);
                    }}
                    disabled={busy}
                    aria-label={`Ukloni ${email.emailAddress}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={openAdd}
        className="mt-2 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-1 text-[13px] font-semibold text-ink outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Plus className="size-4" aria-hidden="true" />
        Dodaj adresu e-pošte
      </button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) void user.reload().catch(() => undefined);
        }}
      >
        <DialogContent className={dialogClass} showCloseButton={false}>
          {dialogOpen ? (
            <EmailDialogBody
              user={user}
              target={verifyTarget}
              onClose={() => setDialogOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Ukloniti adresu e-pošte?"
        description={`Adresa ${toRemove?.emailAddress ?? ""} više se neće moći koristiti za prijavu.`}
        confirmLabel="Ukloni"
        pendingLabel="Uklanjanje…"
        destructive
        onConfirm={remove}
      />
    </div>
  );
}

function EmailDialogBody({
  user,
  target,
  onClose,
}: {
  user: ClerkUser;
  target: EmailAddress | null;
  onClose: () => void;
}) {
  const createEmail = useReverification((email: string) =>
    user.createEmailAddress({ email }),
  );
  const [pendingEmail, setPendingEmail] = useState<EmailAddress | null>(target);
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createEmail(value.trim());
      await created.prepareVerification({ strategy: "email_code" });
      setPendingEmail(created);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    if (!pendingEmail) return;
    setBusy(true);
    setError(null);
    try {
      const res = await pendingEmail.attemptVerification({ code: code.trim() });
      if (res.verification.status !== "verified") {
        setError("Potvrda nije uspjela. Zatražite novi kod.");
        return;
      }
      await user.reload();
      toast.success("Adresa e-pošte je potvrđena.");
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!pendingEmail) return;
    setResending(true);
    setError(null);
    try {
      await pendingEmail.prepareVerification({ strategy: "email_code" });
      toast.success("Novi kod je poslan.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setResending(false);
    }
  }

  if (!pendingEmail) {
    return (
      <form onSubmit={submitEmail} className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-ink">
            Dodaj adresu e-pošte
          </DialogTitle>
          <DialogDescription>
            Poslat ćemo kod na novu adresu da potvrdimo da je vaša.
          </DialogDescription>
        </DialogHeader>
        <Field id="new-email" label="E-pošta">
          <TextInput
            id="new-email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <InlineError message={error} />
        <DialogFooter className="gap-2">
          <button type="button" className={btn.ghost} onClick={onClose}>
            Odustani
          </button>
          <button type="submit" className={btn.primary} disabled={busy}>
            {busy ? <Spinner /> : null}
            Pošalji kod
          </button>
        </DialogFooter>
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-display text-xl font-bold text-ink">
          Potvrdite adresu
        </DialogTitle>
        <DialogDescription>
          Upišite šesteroznamenkasti kod koji smo poslali na{" "}
          <span className="font-medium text-ink break-all">
            {pendingEmail.emailAddress}
          </span>
          .
        </DialogDescription>
      </DialogHeader>
      <CodeField
        id="email-code"
        label="Kod iz e-pošte"
        value={code}
        onChange={setCode}
      />
      <InlineError message={error} />
      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="self-start text-[13px] font-semibold text-ink underline-offset-4 hover:underline disabled:opacity-50"
      >
        {resending ? "Slanje…" : "Pošalji kod ponovno"}
      </button>
      <DialogFooter className="gap-2">
        <button type="button" className={btn.ghost} onClick={onClose}>
          Odustani
        </button>
        <button type="submit" className={btn.primary} disabled={busy}>
          {busy ? <Spinner /> : null}
          Potvrdi
        </button>
      </DialogFooter>
    </form>
  );
}
