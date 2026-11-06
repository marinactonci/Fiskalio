"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { clerkErrorMessage } from "@/components/auth/clerk-errors";
import { resolveRedirect } from "./redirect";
import {
  AuthField,
  AuthHeading,
  AuthInput,
  AuthSwitchLink,
  AuthTabs,
  CodeInput,
  FormError,
  GoogleButton,
  OrDivider,
  SubmitButton,
  TextButton,
  authInputClass,
} from "./ui";

type SignInResource = NonNullable<ReturnType<typeof useSignIn>["signIn"]>;
type SecondFactorOption = NonNullable<
  SignInResource["supportedSecondFactors"]
>[number];
type EmailCodeOption = Extract<SecondFactorOption, { strategy: "email_code" }>;

type Step = "credentials" | "second-factor" | "forgot-request" | "forgot-reset";
type SecondFactor = "totp" | "backup_code" | "email_code";

const UNSUPPORTED_FACTOR =
  "Ovaj račun traži način provjere koji ovdje nije podržan. Javite nam se za pomoć.";
const INCOMPLETE = "Prijava nije dovršena. Pokušajte ponovno.";

/**
 * Picks the second factor to ask for. TOTP wins; an e-mail code shows up when
 * Clerk's client-trust check wants to confirm a sign-in from a new device.
 */
async function prepareSecondFactor(resource: SignInResource) {
  const factors = resource.supportedSecondFactors ?? [];
  if (factors.some((f) => f.strategy === "totp")) {
    return { factor: "totp" as const, sentTo: null };
  }
  const emailFactor = factors.find(
    (f): f is EmailCodeOption => f.strategy === "email_code",
  );
  if (emailFactor) {
    await resource.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: emailFactor.emailAddressId,
    });
    return {
      factor: "email_code" as const,
      sentTo: emailFactor.safeIdentifier,
    };
  }
  if (factors.some((f) => f.strategy === "backup_code")) {
    return { factor: "backup_code" as const, sentTo: null };
  }
  return null;
}

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<Step>("credentials");
  const [factor, setFactor] = useState<SecondFactor>("totp");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A Google sign-in for an account with two-step verification comes back
  // from /sso-callback to /sign-in?korak=provjera with the attempt pending.
  const resumed = useRef(false);
  useEffect(() => {
    if (!isLoaded || resumed.current) return;
    if (params.get("korak") !== "provjera") return;
    if (signIn.status !== "needs_second_factor") return;
    resumed.current = true;
    prepareSecondFactor(signIn)
      .then((next) => {
        if (!next) {
          setError(UNSUPPORTED_FACTOR);
          return;
        }
        setFactor(next.factor);
        setSentTo(next.sentTo);
        setStep("second-factor");
      })
      .catch((err) => setError(clerkErrorMessage(err)));
  }, [isLoaded, signIn, params]);

  function goTo(next: Step) {
    setError(null);
    setCode("");
    setStep(next);
  }

  function switchFactor(next: SecondFactor) {
    setError(null);
    setCode("");
    setFactor(next);
  }

  /** Returns true when navigation away has started (keep the spinner). */
  async function handleResult(res: SignInResource): Promise<boolean> {
    if (res.status === "complete" && res.createdSessionId && setActive) {
      await setActive({ session: res.createdSessionId });
      router.push(resolveRedirect(params.get("redirect_url")));
      return true;
    }
    if (res.status === "needs_second_factor") {
      const next = await prepareSecondFactor(res);
      if (!next) {
        setError(UNSUPPORTED_FACTOR);
        return false;
      }
      setFactor(next.factor);
      setSentTo(next.sentTo);
      goTo("second-factor");
      return false;
    }
    if (res.status === "needs_new_password" && newPassword) {
      return handleResult(await res.resetPassword({ password: newPassword }));
    }
    setError(INCOMPLETE);
    return false;
  }

  async function run(action: () => Promise<boolean>) {
    setError(null);
    setPending(true);
    try {
      const navigating = await action();
      if (!navigating) setPending(false);
    } catch (err) {
      setError(clerkErrorMessage(err));
      setPending(false);
    }
  }

  function onCredentials(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    void run(async () =>
      handleResult(await signIn.create({ identifier: email.trim(), password })),
    );
  }

  function onSecondFactor(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    void run(async () =>
      handleResult(
        await signIn.attemptSecondFactor({
          strategy: factor,
          code: code.trim(),
        }),
      ),
    );
  }

  function onForgotRequest(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    void run(async () => {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setNewPassword("");
      goTo("forgot-reset");
      return false;
    });
  }

  function onForgotReset(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    void run(async () => {
      const res = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });
      if (res.status === "complete") toast.success("Lozinka je promijenjena.");
      return handleResult(res);
    });
  }

  async function resendCode() {
    if (!isLoaded) return;
    setError(null);
    setResending(true);
    try {
      if (step === "forgot-reset") {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email.trim(),
        });
      } else {
        await signIn.prepareSecondFactor({ strategy: "email_code" });
      }
      toast.success("Novi kod je poslan.");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  async function onGoogle() {
    if (!isLoaded) return;
    setError(null);
    setGooglePending(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: resolveRedirect(params.get("redirect_url")),
      });
    } catch (err) {
      setError(clerkErrorMessage(err));
      setGooglePending(false);
    }
  }

  const backToSignIn = (
    <TextButton onClick={() => goTo("credentials")} className="text-sm">
      Natrag na prijavu
    </TextButton>
  );

  if (step === "second-factor") {
    const descriptions: Record<SecondFactor, string> = {
      totp: "Upišite šesteroznamenkasti kod iz aplikacije za autentifikaciju.",
      backup_code:
        "Upišite jedan od rezervnih kodova koje ste spremili kad ste uključili dvostruku provjeru.",
      email_code: `Prijavljujete se s novog uređaja. Poslali smo kod na ${sentTo ?? "vašu e-poštu"}.`,
    };
    return (
      <>
        <AuthHeading title="Dvostruka provjera">
          {descriptions[factor]}
        </AuthHeading>
        <form onSubmit={onSecondFactor} className="mt-7 flex flex-col gap-4">
          {factor === "backup_code" ? (
            <AuthField id="backup-code" label="Rezervni kod">
              <AuthInput
                id="backup-code"
                name="backup-code"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono tracking-wider"
              />
            </AuthField>
          ) : (
            <AuthField
              id="second-factor-code"
              label={factor === "totp" ? "Kod iz aplikacije" : "Kod iz e-pošte"}
            >
              <CodeInput
                id="second-factor-code"
                name="code"
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </AuthField>
          )}
          <FormError message={error} />
          <SubmitButton
            pending={pending}
            pendingLabel="Provjera…"
            disabled={!isLoaded}
          >
            Potvrdi
          </SubmitButton>
        </form>
        <div className="mt-6 flex flex-col items-start gap-3 text-sm">
          {factor === "totp" ? (
            <TextButton onClick={() => switchFactor("backup_code")}>
              Nemate pristup aplikaciji? Koristite rezervni kod
            </TextButton>
          ) : null}
          {factor === "backup_code" ? (
            <TextButton onClick={() => switchFactor("totp")}>
              Koristite kod iz aplikacije
            </TextButton>
          ) : null}
          {factor === "email_code" ? (
            <TextButton onClick={resendCode} disabled={resending}>
              {resending ? "Slanje…" : "Pošalji kod ponovno"}
            </TextButton>
          ) : null}
          {backToSignIn}
        </div>
      </>
    );
  }

  if (step === "forgot-request") {
    return (
      <>
        <AuthHeading title="Zaboravljena lozinka">
          Upišite e-poštu svog računa i poslat ćemo vam kod za postavljanje nove
          lozinke.
        </AuthHeading>
        <form onSubmit={onForgotRequest} className="mt-7 flex flex-col gap-4">
          <AuthField id="reset-email" label="E-pošta">
            <AuthInput
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </AuthField>
          <FormError message={error} />
          <SubmitButton
            pending={pending}
            pendingLabel="Slanje…"
            disabled={!isLoaded}
          >
            Pošalji kod
          </SubmitButton>
        </form>
        <div className="mt-6">{backToSignIn}</div>
      </>
    );
  }

  if (step === "forgot-reset") {
    return (
      <>
        <AuthHeading title="Postavite novu lozinku">
          Poslali smo kod na {email.trim()}. Upišite ga i odaberite novu
          lozinku.
        </AuthHeading>
        <form onSubmit={onForgotReset} className="mt-7 flex flex-col gap-4">
          <AuthField id="reset-code" label="Kod iz e-pošte">
            <CodeInput
              id="reset-code"
              name="code"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </AuthField>
          <AuthField
            id="reset-password"
            label="Nova lozinka"
            hint="Najmanje 8 znakova."
          >
            <PasswordInput
              id="reset-password"
              name="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="reset-password-hint"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={authInputClass}
            />
          </AuthField>
          <FormError message={error} />
          <SubmitButton
            pending={pending}
            pendingLabel="Spremanje…"
            disabled={!isLoaded}
          >
            Spremi lozinku i prijavi se
          </SubmitButton>
        </form>
        <div className="mt-6 flex flex-col items-start gap-3 text-sm">
          <TextButton onClick={resendCode} disabled={resending}>
            {resending ? "Slanje…" : "Pošalji kod ponovno"}
          </TextButton>
          {backToSignIn}
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Dobro došli natrag">
        Prijavite se da vidite što dospijeva ovaj mjesec.
      </AuthHeading>
      <AuthTabs />
      <GoogleButton
        onClick={onGoogle}
        pending={googlePending}
        disabled={!isLoaded || pending}
      />
      <OrDivider />
      <form onSubmit={onCredentials} className="flex flex-col gap-4">
        <AuthField id="email" label="E-pošta">
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AuthField>
        <AuthField
          id="password"
          label="Lozinka"
          aside={
            <TextButton
              onClick={() => goTo("forgot-request")}
              className="text-[13px]"
            >
              Zaboravljena lozinka?
            </TextButton>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        <FormError message={error} />
        <SubmitButton
          pending={pending}
          pendingLabel="Prijava…"
          disabled={!isLoaded || googlePending}
        >
          Prijavi se
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Nemate račun?{" "}
        <AuthSwitchLink to="/sign-up">Registrirajte se</AuthSwitchLink> – treba
        vam samo e-pošta.
      </p>
    </>
  );
}
