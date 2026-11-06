import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignUpForm } from "../_components/SignUpForm";

export const metadata: Metadata = {
  title: "Registracija – Fiskalio",
};

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}
