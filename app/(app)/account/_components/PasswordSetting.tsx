"use client";

import { useState, type FormEvent } from "react";
import { useReverification } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  Field,
  InlineError,
  SettingRow,
  Spinner,
  btn,
  dialogClass,
  errorText,
  inputClass,
  type ClerkUser,
} from "./shared";

export function PasswordSetting({ user }: { user: ClerkUser }) {
  const [open, setOpen] = useState(false);
  const hasPassword = user.passwordEnabled;

  return (
    <SettingRow
      title="Lozinka"
      description={
        hasPassword
          ? "Koristite je za prijavu e-poštom."
          : "Još nije postavljena – prijavljujete se Googleom."
      }
    >
      <button
        type="button"
        className={btn.outline}
        onClick={() => setOpen(true)}
      >
        {hasPassword ? "Promijeni lozinku" : "Postavi lozinku"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={dialogClass} showCloseButton={false}>
          {open ? (
            <PasswordForm user={user} onClose={() => setOpen(false)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </SettingRow>
  );
}

function PasswordForm({
  user,
  onClose,
}: {
  user: ClerkUser;
  onClose: () => void;
}) {
  const hasPassword = user.passwordEnabled;
  const updatePassword = useReverification(
    (params: {
      currentPassword?: string;
      newPassword: string;
      signOutOfOtherSessions: boolean;
    }) => user.updatePassword(params),
  );

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError("Nova lozinka mora imati najmanje 8 znakova.");
      return;
    }
    if (next !== confirm) {
      setError("Lozinke se ne podudaraju.");
      return;
    }
    setBusy(true);
    try {
      await updatePassword({
        currentPassword: hasPassword ? current : undefined,
        newPassword: next,
        signOutOfOtherSessions: signOutOthers,
      });
      toast.success(
        hasPassword ? "Lozinka je promijenjena." : "Lozinka je postavljena.",
      );
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="font-display text-xl font-bold text-ink">
          {hasPassword ? "Promijeni lozinku" : "Postavi lozinku"}
        </DialogTitle>
        <DialogDescription>
          {hasPassword
            ? "Upišite trenutnu lozinku pa odaberite novu."
            : "S lozinkom se možete prijaviti i bez Googlea."}
        </DialogDescription>
      </DialogHeader>

      {/* Lets password managers attach the new password to the right account. */}
      <input
        type="email"
        name="username"
        autoComplete="username"
        value={user.primaryEmailAddress?.emailAddress ?? ""}
        readOnly
        hidden
      />

      {hasPassword ? (
        <Field id="current-password" label="Trenutna lozinka">
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            required
            autoFocus
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
          />
        </Field>
      ) : null}
      <Field id="new-password" label="Nova lozinka" hint="Najmanje 8 znakova.">
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          required
          minLength={8}
          autoFocus={!hasPassword}
          aria-describedby="new-password-hint"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field id="confirm-password" label="Ponovite novu lozinku">
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </Field>
      <label className="flex items-start gap-2.5 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={signOutOthers}
          onChange={(e) => setSignOutOthers(e.target.checked)}
          className="mt-0.5 size-[18px] shrink-0 accent-ink"
        />
        Odjavi me sa svih ostalih uređaja
      </label>

      <InlineError message={error} />
      <DialogFooter className="gap-2">
        <button type="button" className={btn.ghost} onClick={onClose}>
          Odustani
        </button>
        <button type="submit" className={btn.primary} disabled={busy}>
          {busy ? <Spinner /> : null}
          Spremi lozinku
        </button>
      </DialogFooter>
    </form>
  );
}
