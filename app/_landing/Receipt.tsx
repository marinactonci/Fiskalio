import { Bell } from "lucide-react";
import { Dot, PROFILES } from "./shared";

const DUE = [
  { name: "Voda", due: "do 10.11.", amount: "21,45" },
  { name: "HEP struja", due: "do 15.11.", amount: "48,60" },
  { name: "Plin", due: "do 20.11.", amount: "37,20" },
];

const TOTALS = [
  { label: "UKUPNO", value: "181,24 €", className: "", valueClassName: "font-semibold" },
  { label: "PLAĆENO", value: "41,00 €", className: "text-muted-foreground", valueClassName: "" },
  { label: "PREOSTALO", value: "140,24 €", className: "font-semibold", valueClassName: "" },
];

const divider = "border-t-[1.5px] border-dashed border-[#BFC1B6]";

/** Hero illustration: a tilted month "receipt" plus a floating reminder toast. */
export function Receipt() {
  return (
    <div className="relative flex min-w-0 flex-[1_1_400px] justify-center">
      <div className="relative w-full max-w-[420px] rotate-[1.2deg] drop-shadow-[0_18px_30px_rgba(21,23,28,0.12)]">
        <div className="bg-white px-7 pt-7 pb-5 font-mono text-sm text-ink">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold tracking-[0.06em]">STUDENI 2026</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Dot color={PROFILES.stan.color} className="size-[9px]" />
              {PROFILES.stan.name}
            </span>
          </div>

          <div className={`${divider} mt-4 mb-1.5`} />

          <div className="flex justify-between gap-3 py-[9px] text-[#646973]">
            <span>Pričuva zgrade</span>
            <span className="line-through">41,00</span>
          </div>
          <div className="-mx-2 flex justify-between gap-3 rounded bg-lime px-2 py-[9px]">
            <span>
              A1 internet{" "}
              <span className="text-[11px] font-semibold text-late">
                · KASNI 1 DAN
              </span>
            </span>
            <span className="font-semibold">32,99</span>
          </div>
          {DUE.map((row) => (
            <div key={row.name} className="flex justify-between gap-3 py-[9px]">
              <span>
                {row.name}{" "}
                <span className="text-xs text-[#646973]">{row.due}</span>
              </span>
              <span>{row.amount}</span>
            </div>
          ))}

          <div className={`${divider} mt-2.5 mb-3`} />

          {TOTALS.map((row) => (
            <div
              key={row.label}
              className={`flex justify-between gap-3 py-[3px] ${row.className}`}
            >
              <span>{row.label}</span>
              <span className={row.valueClassName}>{row.value}</span>
            </div>
          ))}

          <p className="mt-[18px] text-center text-[11px] tracking-[0.14em] text-[#646973]">
            *** OTVORENO AUTOMATSKI 01.11. ***
          </p>
        </div>

        {/* torn paper edge */}
        <div
          aria-hidden="true"
          className="h-3.5 bg-repeat-x"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #FFFFFF 50%, transparent 50%), linear-gradient(225deg, #FFFFFF 50%, transparent 50%)",
            backgroundSize: "14px 14px",
          }}
        />

        <div
          aria-hidden="true"
          className="absolute top-[88px] -right-3.5 -rotate-[11deg] rounded-md border-[2.5px] border-[#2F6B2A] bg-white/70 px-2.5 py-[5px] font-mono text-[13px] font-semibold tracking-[0.16em] text-[#2F6B2A]"
        >
          PLAĆENO 03.11.
        </div>
      </div>

      <div className="absolute -bottom-[34px] left-0 flex max-w-[290px] items-center gap-3 rounded-[14px] bg-ink px-4 py-3.5 text-white shadow-[0_12px_24px_rgba(21,23,28,0.2)]">
        <span className="grid size-[34px] flex-none place-items-center rounded-[9px] bg-lime">
          <Bell className="size-[18px] text-ink" aria-hidden="true" />
        </span>
        <span className="text-[13px] leading-[1.4]">
          Sutra dospijeva <b>Telemach 24,99 €</b>
          <br />
          <span className="text-[#B9BCC4]">Profil: {PROFILES.mama.name}</span>
        </span>
      </div>
    </div>
  );
}
