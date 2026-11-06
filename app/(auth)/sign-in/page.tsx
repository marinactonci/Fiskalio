import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignInForm } from "../_components/SignInForm";

export const metadata: Metadata = {
  title: "Prijava – Fiskalio",
};

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
