"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  clerkErrorCode,
  clerkErrorMessage,
  clerkErrorParam,
} from "@/components/auth/clerk-errors";
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

type Step = "details" | "verify";

const NAME_PARAMS = new Set(["first_name", "last_name"]);

export function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<Step>("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDetails(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setPending(true);
    const base = { emailAddress: email.trim(), password };
    const names = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
    };
    try {
      try {
        await signUp.create({ ...base, ...names });
      } catch (err) {
        // Instances without the name attributes reject them; the names can
        // still be filled in later under account settings.
        const param = clerkErrorParam(err);
        if (
          clerkErrorCode(err) === "form_param_unknown" &&
          param &&
          NAME_PARAMS.has(param)
        ) {
          await signUp.create(base);
        } else {
          throw err;
        }
      }
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCode("");
      setStep("verify");
    } catch (err) {
      setError(clerkErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setPending(true);
    try {
      const res = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });
      if (res.status === "complete" && res.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        router.push(resolveRedirect(params.get("redirect_url")));
        return; // keep the spinner while navigating
      }
      setError(
        "Registracija nije dovršena jer nedostaju podaci. Pokušajte ponovno ili se registrirajte Googleom.",
      );
    } catch (err) {
      setError(clerkErrorMessage(err));
    }
    setPending(false);
  }

  async function resendCode() {
    if (!isLoaded) return;
    setError(null);
    setResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
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
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: resolveRedirect(params.get("redirect_url")),
      });
    } catch (err) {
      setError(clerkErrorMessage(err));
      setGooglePending(false);
    }
  }

  if (step === "verify") {
    return (
      <>
        <AuthHeading title="Potvrdite e-poštu">
          Poslali smo šesteroznamenkasti kod na {email.trim()}. Upišite ga da
          dovršite registraciju.
        </AuthHeading>
        <form onSubmit={onVerify} className="mt-7 flex flex-col gap-4">
          <AuthField id="signup-code" label="Kod iz e-pošte">
            <CodeInput
              id="signup-code"
              name="code"
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </AuthField>
          <FormError message={error} />
          <SubmitButton
            pending={pending}
            pendingLabel="Provjera…"
            disabled={!isLoaded}
          >
            Potvrdi i nastavi
          </SubmitButton>
        </form>
        <div className="mt-6 flex flex-col items-start gap-3 text-sm">
          <TextButton onClick={resendCode} disabled={resending}>
            {resending ? "Slanje…" : "Pošalji kod ponovno"}
          </TextButton>
          <TextButton
            onClick={() => {
              setError(null);
              setStep("details");
            }}
          >
            Promijeni adresu e-pošte
          </TextButton>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Otvorite račun">
        Besplatno je i treba vam samo e-pošta.
      </AuthHeading>
      <AuthTabs />
      <GoogleButton
        onClick={onGoogle}
        pending={googlePending}
        disabled={!isLoaded || pending}
      />
      <OrDivider />
      <form onSubmit={onDetails} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="first-name" label="Ime">
            <AuthInput
              id="first-name"
              name="given-name"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </AuthField>
          <AuthField id="last-name" label="Prezime">
            <AuthInput
              id="last-name"
              name="family-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </AuthField>
        </div>
        <AuthField id="signup-email" label="E-pošta">
          <AuthInput
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AuthField>
        <AuthField
          id="signup-password"
          label="Lozinka"
          hint="Najmanje 8 znakova."
        >
          <PasswordInput
            id="signup-password"
            name="new-password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="signup-password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        {/* Mount point for Clerk's bot-protection widget. */}
        <div id="clerk-captcha" />
        <FormError message={error} />
        <SubmitButton
          pending={pending}
          pendingLabel="Registracija…"
          disabled={!isLoaded || googlePending}
        >
          Registriraj se
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted-foreground">
        Već imate račun?{" "}
        <AuthSwitchLink to="/sign-in">Prijavite se</AuthSwitchLink>
      </p>
    </>
  );
}
