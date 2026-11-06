"use client";

import { ActiveSessions } from "./ActiveSessions";
import { GoogleSetting } from "./GoogleSetting";
import { PasswordSetting } from "./PasswordSetting";
import { TwoFactorSetting } from "./TwoFactorSetting";
import { SettingsCard, type ClerkUser } from "./shared";

export function SecuritySection({ user }: { user: ClerkUser }) {
  return (
    <SettingsCard id="sigurnost" title="Prijava i sigurnost">
      <div className="mt-3.5 flex flex-col">
        <PasswordSetting user={user} />
        <TwoFactorSetting user={user} />
        <GoogleSetting user={user} />
      </div>
      <ActiveSessions user={user} />
    </SettingsCard>
  );
}
