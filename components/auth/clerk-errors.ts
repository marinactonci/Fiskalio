import {
  isClerkAPIResponseError,
  isClerkRuntimeError,
  isReverificationCancelledError,
} from "@clerk/nextjs/errors";

const GENERIC_ERROR = "Nešto je pošlo po zlu. Pokušajte ponovno.";

/** Croatian copy for the Clerk error codes users can realistically hit. */
const MESSAGES: Record<string, string> = {
  form_identifier_not_found: "Ne postoji račun s ovom adresom e-pošte.",
  form_password_incorrect: "Lozinka nije točna.",
  form_password_validation_failed: "Lozinka nije točna.",
  form_password_or_identifier_incorrect: "E-pošta ili lozinka nisu točni.",
  form_code_incorrect: "Kod nije točan. Provjerite ga i pokušajte ponovno.",
  form_code_expired: "Kod je istekao. Zatražite novi.",
  verification_expired: "Kod je istekao. Zatražite novi.",
  verification_failed: "Previše neuspjelih pokušaja. Zatražite novi kod.",
  form_password_pwned:
    "Ova se lozinka pojavila u poznatom curenju podataka. Odaberite drugu.",
  form_password_length_too_short: "Lozinka mora imati najmanje 8 znakova.",
  form_password_length_too_long: "Lozinka je preduga.",
  form_password_size_in_bytes_exceeded: "Lozinka je preduga.",
  form_password_not_strong_enough:
    "Lozinka nije dovoljno jaka. Produljite je ili kombinirajte riječi, brojeve i simbole.",
  form_new_password_matches_current:
    "Nova lozinka mora se razlikovati od trenutne.",
  form_identifier_exists: "Račun s ovom adresom e-pošte već postoji.",
  form_param_nil: "Ispunite sva obavezna polja.",
  form_param_missing: "Ispunite sva obavezna polja.",
  form_conditional_param_missing: "Ispunite sva obavezna polja.",
  form_param_format_invalid: "Provjerite format unesenih podataka.",
  too_many_requests: "Previše pokušaja. Pričekajte malo pa pokušajte ponovno.",
  user_locked:
    "Račun je privremeno zaključan zbog previše neuspjelih pokušaja. Pokušajte kasnije.",
  strategy_for_user_invalid:
    "Ovaj račun nema lozinku. Prijavite se Googleom ili postavite novu lozinku.",
  session_exists: "Već ste prijavljeni.",
  identifier_already_signed_in: "Već ste prijavljeni s ovim računom.",
  captcha_invalid:
    "Provjera protiv botova nije uspjela. Osvježite stranicu i pokušajte ponovno.",
  captcha_unavailable:
    "Provjera protiv botova trenutačno nije dostupna. Osvježite stranicu i pokušajte ponovno.",
  external_account_exists:
    "Ovaj Google račun već je povezan s drugim korisnikom.",
  oauth_access_denied: "Povezivanje s Googleom je otkazano.",
  not_allowed_access: "Ova adresa e-pošte nema dopušten pristup.",
  network_error:
    "Nema veze s poslužiteljem. Provjerite internetsku vezu i pokušajte ponovno.",
};

const EMAIL_PARAMS = new Set(["identifier", "email_address", "emailAddress"]);

/**
 * Thrown when the identity check went through but the server still refused
 * the change, so the change did not happen.
 */
export class ReverificationFailedError extends Error {
  constructor() {
    super("Reverification did not satisfy the server");
    this.name = "ReverificationFailedError";
  }
}

/** Thrown when the user backs out of an identity check we asked for ourselves. */
export class ReverificationCancelledError extends Error {
  constructor() {
    super("User cancelled the identity check");
    this.name = "ReverificationCancelledError";
  }
}

/** Turns any error thrown by Clerk into a user-facing Croatian sentence. */
export function clerkErrorMessage(err: unknown, fallback = GENERIC_ERROR) {
  if (err instanceof ReverificationFailedError) {
    return "Potvrda identiteta nije prošla, pa promjena nije spremljena. Pokušajte ponovno.";
  }
  if (isClerkAPIResponseError(err)) {
    const first = err.errors[0];
    if (!first) return fallback;
    if (
      first.code === "form_param_format_invalid" &&
      first.meta?.paramName &&
      EMAIL_PARAMS.has(first.meta.paramName)
    ) {
      return "Upišite ispravnu adresu e-pošte.";
    }
    return (
      MESSAGES[first.code] ?? first.longMessage ?? first.message ?? fallback
    );
  }
  if (isClerkRuntimeError(err)) {
    return MESSAGES[err.code] ?? fallback;
  }
  return fallback;
}

/** True when the user closed the "confirm it's you" dialog without verifying. */
export function isReverificationCancelled(err: unknown) {
  return (
    err instanceof ReverificationCancelledError ||
    isReverificationCancelledError(err)
  );
}

/** First Clerk error code, if any (used to branch on specific failures). */
export function clerkErrorCode(err: unknown): string | undefined {
  if (isClerkAPIResponseError(err)) return err.errors[0]?.code;
  if (isClerkRuntimeError(err)) return err.code;
  return undefined;
}

export function clerkErrorParam(err: unknown): string | undefined {
  if (isClerkAPIResponseError(err)) return err.errors[0]?.meta?.paramName;
  return undefined;
}
