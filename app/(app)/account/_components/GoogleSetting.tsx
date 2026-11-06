"use client";

import { useState } from "react";
import { useReverification } from "@clerk/nextjs";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import {
  ConfirmDialog,
  SettingRow,
  Spinner,
  btn,
  reportError,
  type ClerkUser,
  type ExternalAccount,
} from "./shared";

/** Where Google sends the user back after linking: this page, no hash. */
function returnUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

export function GoogleSetting({ user }: { user: ClerkUser }) {
  const connect = useReverification(() =>
    user.createExternalAccount({
      strategy: "oauth_google",
      redirectUrl: returnUrl(),
    }),
  );
  const reconnect = useReverification((account: ExternalAccount) =>
    account.reauthorize({ redirectUrl: returnUrl() }),
  );
  const disconnect = useReverification((account: ExternalAccount) =>
    account.destroy(),
  );

  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const google = user.externalAccounts.find((a) => a.provider === "google");
  const verified = google?.verification?.status === "verified";
  // Without a password, unlinking Google could leave no way to sign in.
  const canDisconnect = user.passwordEnabled;

  async function startLink(action: () => Promise<ExternalAccount>) {
    setBusy(true);
    try {
      const account = await action();
      const url = account.verification?.externalVerificationRedirectURL;
      if (!url) throw new Error("missing redirect");
      window.location.assign(url.href);
      // Keep the spinner while the browser leaves for Google.
    } catch (err) {
      reportError(
        err,
        "Povezivanje s Googleom nije uspjelo. Pokušajte ponovno.",
      );
      setBusy(false);
    }
  }

  async function onDisconnect() {
    if (!google) return true;
    try {
      await disconnect(google);
      await user.reload();
      toast.success("Google račun je odspojen.");
      return true;
    } catch (err) {
      reportError(err);
      return false;
    }
  }

  let description: string;
  if (google && verified) {
    description = canDisconnect
      ? `Povezano · ${google.emailAddress}`
      : `Povezano · ${google.emailAddress}. Postavite lozinku ako ga želite odspojiti.`;
  } else if (google) {
    description =
      google.verification?.error?.code === "external_account_exists"
        ? "Ovaj Google račun već je povezan s drugim korisnikom."
        : "Povezivanje nije dovršeno.";
  } else {
    description = "Nije povezano. Povežite Google za brzu prijavu.";
  }

  return (
    <SettingRow
      title="Google"
      description={description}
      icon={
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line">
          <GoogleIcon />
        </span>
      }
    >
      {google && verified ? (
        <button
          type="button"
          className={btn.outline}
          onClick={() => setConfirmOpen(true)}
          disabled={!canDisconnect}
        >
          Odspoji
        </button>
      ) : (
        <button
          type="button"
          className={btn.outline}
          onClick={() =>
            void startLink(google ? () => reconnect(google) : () => connect())
          }
          disabled={busy}
        >
          {busy ? <Spinner /> : null}
          {google ? "Poveži ponovno" : "Poveži"}
        </button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Odspojiti Google račun?"
        description="Više se nećete moći prijaviti Googleom. I dalje se možete prijaviti e-poštom i lozinkom."
        confirmLabel="Odspoji"
        pendingLabel="Odspajanje…"
        destructive
        onConfirm={onDisconnect}
      />
    </SettingRow>
  );
}
