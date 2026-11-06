import { Logo } from "@/components/brand/Logo";
import { MonthPreview } from "./_components/MonthPreview";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh bg-paper text-[15px] text-ink">
      <div className="flex min-w-0 flex-1 flex-col px-[clamp(16px,5vw,64px)] py-8">
        <Logo href="/" className="self-start" />

        <main className="mx-auto my-auto w-full max-w-[400px] py-12">
          {children}
        </main>

        <p className="text-[13px] text-muted-foreground">
          Korištenjem Fiskalia prihvaćate uvjete korištenja i pravila
          privatnosti.
        </p>
      </div>

      <MonthPreview />
    </div>
  );
}
