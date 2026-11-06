import type { Metadata } from "next";
import { AccountSettings } from "./_components/AccountSettings";

export const metadata: Metadata = {
  title: "Postavke računa – Fiskalio",
};

export default function AccountPage() {
  return <AccountSettings />;
}
