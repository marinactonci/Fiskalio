import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StartLink } from "./AuthLinks";
import { container, displayHeading, inkButton } from "./shared";

/** Lime closing call-to-action block. */
export function FinalCta() {
  return (
    <section
      aria-labelledby="cta-naslov"
      className={cn(container, "py-20 md:py-28")}
    >
      <div className="flex flex-wrap items-end justify-between gap-8 rounded-[28px] bg-lime p-[clamp(32px,6vw,72px)]">
        <h2
          id="cta-naslov"
          className={cn(
            displayHeading,
            "min-w-0 flex-[1_1_520px] text-[clamp(36px,4.8vw,64px)] leading-none",
          )}
        >
          Sljedeći račun stiže za koji dan. Neka ga dočeka popis.
        </h2>
        <StartLink className={cn(inkButton, "px-6 py-[17px] text-[17px]")}>
          Počni pratiti račune
          <ArrowRight className="size-[18px]" aria-hidden="true" />
        </StartLink>
      </div>
    </section>
  );
}
