"use client";

import * as React from "react";
import {
  useAuth,
  useReverification as useClerkReverification,
  useSession,
} from "@clerk/nextjs";
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
  CODE_LENGTH,
  CodeStatus,
  OtpInput,
  useCodeCheck,
} from "@/components/auth/OtpInput";
import {
  ReverificationCancelledError,
  ReverificationFailedError,
} from "@/components/auth/clerk-errors";
import {
  Field,
  InlineError,
  Spinner,
  TextInput,
  btn,
  dialogClass,
  errorText,
  inputClass,
} from "./shared";

/*
 * Clerk asks for a fresh sign-in check before sensitive changes (adding an
 * e-mail, changing the password, 2FA, deleting the account…). By default
 * `useReverification` answers that with Clerk's own modal; passing
 * `onNeedsReverification` switches it off, and this file supplies our dialog.
 */

type Fetcher = Parameters<typeof useClerkReverification>[0];
type ReverificationRequest = Parameters<
  NonNullable<
    NonNullable<
      Parameters<typeof useClerkReverification>[1]
    >["onNeedsReverification"]
  >
>[0];
type Session = NonNullable<ReturnType<typeof useSession>["session"]>;
type Verification = Awaited<ReturnType<Session["startVerification"]>>;
type Level = ReverificationRequest["level"];
type EmailFactor = Extract<
  NonNullable<Verification["supportedFirstFactors"]>[number],
  { strategy: "email_code" }
>;

const RequestContext = React.createContext<
  ((request: ReverificationRequest) => void) | null
>(null);

/**
 * Drop-in for Clerk's `useReverification` that shows our dialog instead of
 * Clerk's. Needs a `<ReverificationProvider>` above it.
 */
export function useReverification<F extends Fetcher>(fetcher: F) {
  const ask = React.useContext(RequestContext);
  const run = useClerkReverification(fetcher, {
    onNeedsReverification: (request) => {
      if (ask) {
        ask(request);
      } else {
        console.error("useReverification needs a <ReverificationProvider>.");
        request.cancel();
      }
    },
  });
  // Clerk retries once after a successful check and hands back the
  // "reverification required" hint as if it were the result when the server
  // still refuses. Treat that as the failure it is, not as success.
  return React.useCallback(
    (async (...args) => {
      const result = await run(...args);
      if (isReverificationHint(result)) throw new ReverificationFailedError();
      return result;
    }) as typeof run,
    [run],
  );
}

/**
 * Checks identity up front, for work that must not be interrupted halfway
 * (Clerk normally asks only once the protected call is refused). Resolves
 * straight away when the session was verified recently enough, otherwise
 * after the user confirms in our dialog. Rejects with a
 * `ReverificationCancelledError` if they back out.
 */
export function useFreshVerification() {
  const ask = React.useContext(RequestContext);
  const { has } = useAuth();
  return React.useCallback(async () => {
    // Clerk's strictest preset (every factor the user has, within the last
    // 10 minutes), so the protected call that follows won't ask again.
    if (has?.({ reverification: "strict_mfa" })) return;
    await new Promise<void>((resolve, reject) => {
      const cancel = () => reject(new ReverificationCancelledError());
      if (!ask) {
        console.error("useFreshVerification needs a <ReverificationProvider>.");
        cancel();
        return;
      }
      ask({ level: "multi_factor", complete: resolve, cancel });
    });
  }, [ask, has]);
}

function isReverificationHint(value: unknown) {
  if (typeof value !== "object" || value === null) return false;
  const hint = (value as { clerk_error?: { type?: string; reason?: string } })
    .clerk_error;
  return hint?.type === "forbidden" && hint.reason === "reverification-error";
}

type Pending = ReverificationRequest & { id: number };

export function ReverificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // `shown` survives closing so the dialog doesn't blank while it animates out.
  const [shown, setShown] = React.useState<Pending | null>(null);
  const [open, setOpen] = React.useState(false);
  const pending = React.useRef<Pending | null>(null);
  const nextId = React.useRef(0);

  const ask = React.useCallback((request: ReverificationRequest) => {
    // A newer request replaces one that is still waiting.
    pending.current?.cancel();
    const next = { ...request, id: ++nextId.current };
    pending.current = next;
    setShown(next);
    setOpen(true);
  }, []);

  const settle = React.useCallback((outcome: "complete" | "cancel") => {
    const request = pending.current;
    if (!request) return;
    pending.current = null;
    setOpen(false);
    if (outcome === "complete") request.complete();
    else request.cancel();
  }, []);

  // Leaving the page must not leave the original request hanging forever.
  React.useEffect(() => {
    const ref = pending;
    return () => ref.current?.cancel();
  }, []);

  return (
    <RequestContext.Provider value={ask}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) settle("cancel");
        }}
      >
        <DialogContent className={dialogClass} showCloseButton={false}>
          {shown ? (
            <ReverificationBody
              key={shown.id}
              level={shown.level}
              isActive={() => pending.current?.id === shown.id}
              onComplete={() => settle("complete")}
              onCancel={() => settle("cancel")}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </RequestContext.Provider>
  );
}

type Step =
  | { kind: "loading" }
  | { kind: "password" }
  | { kind: "email_code"; sentTo: string }
  | { kind: "totp" }
  | { kind: "backup_code" }
  | { kind: "unsupported" };

type Options = {
  password: boolean;
  email: EmailFactor | null;
  totp: boolean;
  backup: boolean;
};

const INTRO = "Radi sigurnosti ovu promjenu potvrđujemo još jednom.";

function ReverificationBody({
  level,
  isActive,
  onComplete,
  onCancel,
}: {
  level: Level;
  /** False once this request was cancelled or replaced. */
  isActive: () => boolean;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const [step, setStep] = React.useState<Step>({ kind: "loading" });
  const [options, setOptions] = React.useState<Options>({
    password: false,
    email: null,
    totp: false,
    backup: false,
  });
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const codeCheck = useCodeCheck();

  const sendEmailCode = React.useCallback(
    async (factor: EmailFactor) => {
      if (!session) return;
      await session.prepareFirstFactorVerification({
        strategy: "email_code",
        emailAddressId: factor.emailAddressId,
      });
      setCode("");
      setError(null);
      setStep({ kind: "email_code", sentTo: factor.safeIdentifier });
    },
    [session],
  );

  /** Moves to whatever Clerk wants next. Resolves true once verified. */
  const advance = React.useCallback(
    async (res: Verification): Promise<boolean> => {
      // Cancelled meanwhile (e.g. while "Pripremamo provjeru…" was showing):
      // don't e-mail a code nobody is waiting for.
      if (!isActive()) return true;
      if (res.status === "complete") {
        onComplete();
        return true;
      }
      if (res.status === "needs_first_factor") {
        const factors = res.supportedFirstFactors ?? [];
        const hasPassword = factors.some((f) => f.strategy === "password");
        const emails = factors.filter(
          (f): f is EmailFactor => f.strategy === "email_code",
        );
        const email = emails.find((f) => f.primary) ?? emails[0] ?? null;
        setOptions((o) => ({ ...o, password: hasPassword, email }));
        // The password is quicker than waiting for an e-mail.
        if (hasPassword) setStep({ kind: "password" });
        else if (email) await sendEmailCode(email);
        else setStep({ kind: "unsupported" });
        return false;
      }
      const factors = res.supportedSecondFactors ?? [];
      const totp = factors.some((f) => f.strategy === "totp");
      const backup = factors.some((f) => f.strategy === "backup_code");
      setOptions((o) => ({ ...o, totp, backup }));
      setCode("");
      setError(null);
      setStep(
        totp
          ? { kind: "totp" }
          : backup
            ? { kind: "backup_code" }
            : { kind: "unsupported" },
      );
      return false;
    },
    [isActive, onComplete, sendEmailCode],
  );

  const started = React.useRef(false);
  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!session) {
      setStep({ kind: "unsupported" });
      return;
    }
    session
      // Clerk passes no level for its own API calls. Its built-in modal then
      // asks for the strongest factor, which is what the server checks:
      // TOTP for users who have it, the first factor for everyone else.
      .startVerification({ level: level ?? "second_factor" })
      .then(advance)
      .catch((err) => {
        if (!isActive()) return;
        setError(errorText(err));
        setStep({ kind: "unsupported" });
      });
  }, [session, level, advance, isActive]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    try {
      await advance(
        await session.attemptFirstFactorVerification({
          strategy: "password",
          password,
        }),
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  function verifyCode(entered: string) {
    if (!session) return;
    const kind = step.kind;
    if (kind !== "email_code" && kind !== "totp") return;
    void codeCheck.run(async () => {
      setError(null);
      try {
        const res =
          kind === "email_code"
            ? await session.attemptFirstFactorVerification({
                strategy: "email_code",
                code: entered,
              })
            : await session.attemptSecondFactorVerification({
                strategy: "totp",
                code: entered,
              });
        return await advance(res);
      } catch (err) {
        setCode("");
        setError(errorText(err));
      }
    });
  }

  async function submitBackupCode(e: React.FormEvent) {
    e.preventDefault();
    if (!session || busy) return;
    setBusy(true);
    setError(null);
    try {
      await advance(
        await session.attemptSecondFactorVerification({
          strategy: "backup_code",
          code: code.trim(),
        }),
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function switchToEmail() {
    if (!options.email) return;
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(options.email);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!options.email) return;
    setResending(true);
    setError(null);
    try {
      await sendEmailCode(options.email);
      toast.success("Novi kod je poslan.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setResending(false);
    }
  }

  function goTo(next: Step) {
    setCode("");
    setError(null);
    setStep(next);
  }

  function submitCodeOnEnter(e: React.FormEvent) {
    e.preventDefault();
    if (code.length === CODE_LENGTH) verifyCode(code);
  }

  const cancelButton = (
    <button
      type="button"
      className={btn.ghost}
      onClick={onCancel}
      disabled={codeCheck.checking}
    >
      Odustani
    </button>
  );

  const linkClass =
    "self-start text-[13px] font-semibold text-ink underline-offset-4 hover:underline disabled:opacity-50";

  const header = (description: React.ReactNode) => (
    <DialogHeader>
      <DialogTitle className="font-display text-xl font-bold text-ink">
        Potvrdite da ste to vi
      </DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
  );

  if (step.kind === "loading") {
    return (
      <div className="flex flex-col gap-4">
        {header(INTRO)}
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <Spinner />
          Pripremamo provjeru…
        </p>
        <DialogFooter className="gap-2">{cancelButton}</DialogFooter>
      </div>
    );
  }

  if (step.kind === "password") {
    return (
      <form onSubmit={submitPassword} className="flex flex-col gap-4">
        {header(`${INTRO} Upišite svoju lozinku.`)}
        <Field id="reverify-password" label="Lozinka">
          <PasswordInput
            id="reverify-password"
            name="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error !== null || undefined}
            aria-describedby={error ? "reverify-error" : undefined}
            className={inputClass}
          />
        </Field>
        <InlineError id="reverify-error" message={error} />
        {options.email ? (
          <button
            type="button"
            onClick={switchToEmail}
            disabled={busy}
            className={linkClass}
          >
            Radije mi pošaljite kod na e-poštu
          </button>
        ) : null}
        <DialogFooter className="gap-2">
          {cancelButton}
          <button type="submit" className={btn.primary} disabled={busy}>
            {busy ? <Spinner /> : null}
            Potvrdi
          </button>
        </DialogFooter>
      </form>
    );
  }

  if (step.kind === "email_code" || step.kind === "totp") {
    const isEmail = step.kind === "email_code";
    return (
      <form onSubmit={submitCodeOnEnter} className="flex flex-col gap-4">
        {header(
          isEmail ? (
            <>
              {INTRO} Poslali smo šesteroznamenkasti kod na{" "}
              <span className="font-medium break-all text-ink">
                {step.sentTo}
              </span>
              .
            </>
          ) : (
            "Upišite šesteroznamenkasti kod iz aplikacije za autentifikaciju."
          ),
        )}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="reverify-code"
            className="text-[13px] font-semibold text-ink"
          >
            {isEmail ? "Kod iz e-pošte" : "Kod iz aplikacije"}
          </label>
          <OtpInput
            key={step.kind}
            ref={codeCheck.inputRef}
            id="reverify-code"
            name="code"
            autoFocus
            value={code}
            onChange={(next) => {
              setCode(next);
              if (error) setError(null);
            }}
            onComplete={verifyCode}
            disabled={codeCheck.checking}
            invalid={error !== null}
            aria-describedby={
              error
                ? "reverify-error reverify-code-status"
                : "reverify-code-status"
            }
          />
          <CodeStatus id="reverify-code-status" checking={codeCheck.checking} />
        </div>
        <InlineError id="reverify-error" message={error} />
        <div className="flex flex-col items-start gap-2.5">
          {isEmail ? (
            <button
              type="button"
              onClick={resend}
              disabled={resending || codeCheck.checking}
              className={linkClass}
            >
              {resending ? "Slanje…" : "Pošalji kod ponovno"}
            </button>
          ) : null}
          {isEmail && options.password ? (
            <button
              type="button"
              onClick={() => goTo({ kind: "password" })}
              disabled={codeCheck.checking}
              className={linkClass}
            >
              Upišite lozinku umjesto koda
            </button>
          ) : null}
          {!isEmail && options.backup ? (
            <button
              type="button"
              onClick={() => goTo({ kind: "backup_code" })}
              disabled={codeCheck.checking}
              className={linkClass}
            >
              Nemate pristup aplikaciji? Koristite rezervni kod
            </button>
          ) : null}
        </div>
        <DialogFooter className="gap-2">{cancelButton}</DialogFooter>
      </form>
    );
  }

  if (step.kind === "backup_code") {
    return (
      <form onSubmit={submitBackupCode} className="flex flex-col gap-4">
        {header(
          "Upišite jedan od rezervnih kodova koje ste spremili kad ste uključili dvostruku provjeru.",
        )}
        <Field id="reverify-backup" label="Rezervni kod">
          <TextInput
            id="reverify-backup"
            name="backup-code"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            aria-invalid={error !== null || undefined}
            aria-describedby={error ? "reverify-error" : undefined}
            className="font-mono tracking-wider"
          />
        </Field>
        <InlineError id="reverify-error" message={error} />
        {options.totp ? (
          <button
            type="button"
            onClick={() => goTo({ kind: "totp" })}
            disabled={busy}
            className={linkClass}
          >
            Koristite kod iz aplikacije
          </button>
        ) : null}
        <DialogFooter className="gap-2">
          {cancelButton}
          <button type="submit" className={btn.primary} disabled={busy}>
            {busy ? <Spinner /> : null}
            Potvrdi
          </button>
        </DialogFooter>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header(
        "Ovu promjenu sada ne možemo potvrditi. Odjavite se, ponovno se prijavite i pokušajte opet.",
      )}
      <InlineError message={error} />
      <DialogFooter className="gap-2">
        <button type="button" className={btn.primary} onClick={onCancel}>
          Zatvori
        </button>
      </DialogFooter>
    </div>
  );
}
