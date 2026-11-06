import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { HeaderAuthButtons } from "./AuthLinks";
import { container, focusRing } from "./shared";

const NAV = [
  { href: "#kako", label: "Kako radi" },
  { href: "#automatika", label: "Automatika" },
  { href: "#pogledi", label: "Kalendar i statistika" },
  { href: "#pitanja", label: "Pitanja" },
];

export function LandingHeader() {
  return (
    <header className="border-b border-line">
      <div
        className={cn(
          container,
          "flex flex-wrap items-center justify-between gap-3 py-[18px] sm:gap-6",
        )}
      >
        <Logo className={cn("rounded-lg", focusRing)} />
        <nav
          aria-label="Glavna navigacija"
          className="hidden gap-7 text-[15px] font-medium lg:flex"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-sm transition-colors hover:text-ink-2",
                focusRing,
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <HeaderAuthButtons />
      </div>
    </header>
  );
}
