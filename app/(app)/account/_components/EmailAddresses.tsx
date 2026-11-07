"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { useReverification } from "./Reverification";
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
  type ExternalAccount,
} from "./shared";
import { CODE_LENGTH, useCodeCheck } from "@/components/auth/OtpInput";

type Removal =
  | { email: EmailAddress; mode: "plain" }
  | { email: EmailAddress; mode: "unlink"; account: ExternalAccount }
  | { email: EmailAddress; mode: "blocked" };

export function EmailAddresses({ user }: { user: ClerkUser }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<EmailAddress | null>(null);
  // Fixed when the dialog opens (and kept after closing so the text doesn't
  // blank during the exit animation): reloading the user halfway through an
  // unlink must not flip the dialog to another variant.
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setPrimary = useReverification((id: string) =>
    user.update({ primaryEmailAddressId: id }),
  );
  const destroyEmail = useReverification((email: EmailAddress) =>
    email.destroy(),
  );
  const disconnectAccount = useReverification((account: ExternalAccount) =>
    account.destroy(),
  );

  const emails = [...user.emailAddresses].sort((a, b) => {
    if (a.id === user.primaryEmailAddressId) return -1;
    if (b.id === user.primaryEmailAddressId) return 1;
    return 0;
  });

  // Clerk refuses to delete an address a connected (Google) account uses, so
  // the dialog has to know about that link up front.
  function askToRemove(email: EmailAddress) {
    let next: Removal = { email, mode: "plain" };
    if (email.linkedTo.length > 0) {
      const account = user.externalAccounts.find((a) =>
        email.linkedTo.some((link) => link.id === a.id),
      );
      // Without a password, unlinking Google could leave no way to sign in.
      next =
        account && user.passwordEnabled
          ? { email, mode: "unlink", account }
          : { email, mode: "blocked" };
    }
    setRemoval(next);
    setRemoveOpen(true);
  }

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
    if (!removal) return true;
    try {
      await destroyEmail(removal.email);
      await user.reload();
      toast.success("Adresa e-pošte je uklonjena.");
      return true;
    } catch (err) {
      reportError(err);
      return false;
    }
  }

  /** Unlinks the Google account that uses the address, then removes it. */
  async function unlinkAndRemove() {
    if (removal?.mode !== "unlink") return true;
    const { email, account } = removal;
    try {
      await disconnectAccount(account);
    } catch (err) {
      reportError(err);
      return false;
    }
    let left: EmailAddress | undefined;
    try {
      const fresh = await user.reload();
      // Clerk may already have dropped the address together with the account.
      left = fresh.emailAddresses.find((e) => e.id === email.id);
      if (left) {
        await destroyEmail(left);
        await user.reload();
      }
      toast.success("Google je odspojen, a adresa e-pošte uklonjena.");
      return true;
    } catch {
      // Google is already gone; the address is now a plain one, so a retry
      // from the same dialog just removes it.
      setRemoval({ email: left ?? email, mode: "plain" });
      toast.error(
        "Google je odspojen, ali adresu nismo uspjeli ukloniti. Pokušajte ponovno.",
      );
      void user.reload().catch(() => undefined);
      return false;
    }
  }

  let removeDialog: Pick<
    ComponentProps<typeof ConfirmDialog>,
    "title" | "description" | "confirmLabel" | "pendingLabel" | "onConfirm"
  >;
  const address = removal?.email.emailAddress ?? "";
  if (!removal || removal.mode === "plain") {
    removeDialog = {
      title: "Ukloniti adresu e-pošte?",
      description: `Adresa ${address} više se neće moći koristiti za prijavu.`,
      confirmLabel: "Ukloni",
      pendingLabel: "Uklanjanje…",
      onConfirm: remove,
    };
  } else if (removal.mode === "unlink") {
    removeDialog = {
      title: "Odspojiti Google i ukloniti adresu?",
      description: `Adresu ${address} koristi vaš povezani Google račun, pa se ne može ukloniti dok je Google povezan. Ako nastavite, odspojit ćemo Google i ukloniti adresu. Prijavljivat ćete se e-poštom i lozinkom.`,
      confirmLabel: "Odspoji i ukloni",
      pendingLabel: "Uklanjanje…",
      onConfirm: unlinkAndRemove,
    };
  } else {
    removeDialog = {
      title: "Adresa je povezana s Googleom",
      description: `Adresu ${address} koristi vaš povezani Google račun, pa se ne može ukloniti dok je Google povezan. Da biste odspojili Google, prvo pod „Prijava i sigurnost“ postavite lozinku – inače se ne biste imali kako prijaviti.`,
      confirmLabel: "U redu",
      pendingLabel: "",
    };
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
              {email.linkedTo.length > 0 ? (
                <Badge tone="soft">
                  {email.linkedTo.some((l) => l.type === "oauth_google")
                    ? "GOOGLE"
                    : "POVEZANA"}
                </Badge>
              ) : null}
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
                    onClick={() => askToRemove(email)}
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
        destructive
        {...removeDialog}
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
  const codeCheck = useCodeCheck();

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

  function verify(entered: string) {
    if (!pendingEmail) return;
    void codeCheck.run(async () => {
      setError(null);
      try {
        const res = await pendingEmail.attemptVerification({ code: entered });
        if (res.verification.status !== "verified") {
          setCode("");
          setError("Potvrda nije uspjela. Zatražite novi kod.");
          return;
        }
        await user.reload();
        toast.success("Adresa e-pošte je potvrđena.");
        onClose();
      } catch (err) {
        setCode("");
        setError(errorText(err));
      }
    });
  }

  // Enter in the code field; normally the last digit already started the check.
  function submitCode(e: FormEvent) {
    e.preventDefault();
    if (code.length === CODE_LENGTH) verify(code);
  }

  async function resend() {
    if (!pendingEmail) return;
    setResending(true);
    setError(null);
    try {
      await pendingEmail.prepareVerification({ strategy: "email_code" });
      setCode("");
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
        onChange={(next) => {
          setCode(next);
          if (error) setError(null);
        }}
        onComplete={verify}
        checking={codeCheck.checking}
        errorId={error ? "email-code-error" : undefined}
        inputRef={codeCheck.inputRef}
      />
      <InlineError id="email-code-error" message={error} />
      <button
        type="button"
        onClick={resend}
        disabled={resending || codeCheck.checking}
        className="self-start text-[13px] font-semibold text-ink underline-offset-4 hover:underline disabled:opacity-50"
      >
        {resending ? "Slanje…" : "Pošalji kod ponovno"}
      </button>
      <DialogFooter className="gap-2">
        <button type="button" className={btn.ghost} onClick={onClose}>
          Odustani
        </button>
      </DialogFooter>
    </form>
  );
}
