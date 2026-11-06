import { cn } from "@/lib/utils";
import { container, focusRing } from "./shared";

// TODO: point these at real pages once privacy / terms / contact exist.
const LINKS = [
  { href: "#", label: "Privatnost" },
  { href: "#", label: "Uvjeti korištenja" },
  { href: "#", label: "Kontakt" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div
        className={cn(
          container,
          "flex flex-wrap justify-between gap-4 py-7 text-sm text-muted-foreground",
        )}
      >
        <span className="font-display text-lg font-extrabold text-ink">
          fiskalio
        </span>
        <nav aria-label="Podnožje" className="flex flex-wrap gap-6">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                "rounded-sm underline underline-offset-[3px] transition-colors hover:text-ink",
                focusRing,
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
