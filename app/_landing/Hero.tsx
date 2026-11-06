import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StartLink } from "./AuthLinks";
import { Receipt } from "./Receipt";
import { container, eyebrow, focusRing, inkButton } from "./shared";

export function Hero() {
  return (
    <section
      className={cn(
        container,
        "flex flex-wrap items-center gap-14 pt-12 pb-[88px] md:pt-[72px]",
      )}
    >
      <div className="min-w-0 flex-[999_1_520px]">
        <p className={cn(eyebrow, "mb-[22px]")}>
          Struja · voda · plin · internet · pričuva
        </p>
        <h1 className="font-display text-[42px] leading-[0.98] font-extrabold tracking-[-0.035em] min-[400px]:text-[clamp(46px,6.2vw,88px)]">
          Svaki račun.
          <br />
          Svaki mjesec.
          <br />
          <span className="rounded-md bg-lime px-2.5 box-decoration-clone">
            Bez pamćenja.
          </span>
        </h1>
        <p className="mt-7 max-w-[540px] text-lg leading-[1.55] text-ink-2 sm:text-[19px]">
          Fiskalio prvog dana u mjesecu sam otvori nove uplate za sve vaše
          račune, upozori vas što dospijeva i pokaže kamo odlazi novac – po
          stanu, po računu i po mjesecu.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <StartLink className={cn(inkButton, "px-[22px] py-[15px] text-base")}>
            Počni pratiti račune
            <ArrowRight className="size-[18px]" aria-hidden="true" />
          </StartLink>
          <a
            href="#kako"
            className={cn(
              "inline-flex items-center rounded-xl border border-input bg-card px-[22px] py-[15px] text-base font-semibold transition-colors hover:text-ink-2",
              focusRing,
            )}
          >
            Pogledaj kako radi
          </a>
        </div>
      </div>

      <Receipt />
    </section>
  );
}
