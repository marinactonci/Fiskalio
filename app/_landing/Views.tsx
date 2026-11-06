import { cn } from "@/lib/utils";
import { container, displayHeading, Dot, PROFILES } from "./shared";

const WEEKDAYS = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

type Day = {
  day: number;
  tone?: "late" | "today";
  chips?: { label: string; color: string }[];
};

const DAYS: Day[] = [
  { day: 2 },
  { day: 3 },
  { day: 4 },
  {
    day: 5,
    tone: "late",
    chips: [{ label: "A1 32,99", color: PROFILES.stan.color }],
  },
  { day: 6, tone: "today" },
  { day: 7 },
  { day: 8 },
  { day: 9 },
  { day: 10, chips: [{ label: "Voda 21,45", color: PROFILES.stan.color }] },
  { day: 11 },
  { day: 12 },
  { day: 13 },
  { day: 14 },
  {
    day: 15,
    chips: [
      { label: "HEP 48,60", color: PROFILES.stan.color },
      { label: "HEP 19,80", color: PROFILES.brac.color },
    ],
  },
];

/** Gas bill, last 12 months, as % of chart height. Last bar = current month. */
const GAS = [82, 90, 74, 52, 30, 22, 20, 20, 24, 31, 36, 42];

const pill = "rounded-full px-3 py-[7px] text-[13px] font-semibold";

function CalendarTeaser() {
  return (
    <div className="min-w-0 flex-[1.4_1_560px] rounded-[20px] border border-line bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn(pill, "bg-ink text-white")}>Neplaćeno</span>
        {[PROFILES.stan, PROFILES.brac].map((profile) => (
          <span
            key={profile.name}
            className={cn(pill, "inline-flex items-center gap-1.5 border border-input")}
          >
            <Dot color={profile.color} className="size-2" />
            {profile.name}
          </span>
        ))}
        <span
          className={cn(
            pill,
            "border border-dashed border-[#A9ACA0] text-muted-foreground",
          )}
        >
          + Račun
        </span>
        <span className="ml-auto font-mono text-sm font-semibold">200,34 €</span>
      </div>

      <div className="mt-[18px] grid grid-cols-7 gap-1 text-xs sm:gap-1.5">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="px-1 text-muted-foreground">
            {weekday}
          </span>
        ))}
        {DAYS.map(({ day, tone, chips }) => (
          <div
            key={day}
            className={cn(
              "flex min-h-16 min-w-0 flex-col gap-1 rounded-lg p-1 sm:p-1.5",
              tone === "late"
                ? "bg-late-bg"
                : tone === "today"
                  ? "bg-lime font-bold"
                  : "bg-[#F6F6F2]",
            )}
          >
            <span
              className={cn(
                tone === "late" && "font-semibold text-late",
                !tone && "text-[#646973]",
              )}
            >
              {day}
            </span>
            {chips?.map((chip) => (
              <span
                key={chip.label}
                className="overflow-hidden rounded border-l-[3px] bg-white px-1 py-0.5 text-[10px] leading-[1.4] whitespace-nowrap sm:px-[5px] sm:text-[11px]"
                style={{ borderLeftColor: chip.color }}
              >
                {chip.label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsTeaser() {
  return (
    <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[20px] border border-line bg-card p-6">
      <p className="font-semibold">
        Plin, {PROFILES.stan.name} – zadnjih 12 mjeseci
      </p>
      <div
        aria-hidden="true"
        className="flex h-[150px] items-end gap-1.5 border-b border-line pb-1"
      >
        {GAS.map((height, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t",
              i === GAS.length - 1
                ? "border-[1.5px] border-b-0 border-ink bg-lime"
                : "bg-ink",
            )}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-xs text-muted-foreground">
        <span>pro 2025</span>
        <span>stu 2026</span>
      </div>
      <p className="mt-auto text-[15px] text-ink-2">
        Vidite kad je račun poskupio i koliko vas stan zapravo košta godišnje –
        bez tablica i ručnog zbrajanja.
      </p>
    </div>
  );
}

/** "Isti podaci, tri pogleda": calendar + statistics teasers. */
export function Views() {
  return (
    <section
      id="pogledi"
      aria-labelledby="pogledi-naslov"
      className={cn(container, "pt-20 pb-10 md:pt-28")}
    >
      <h2
        id="pogledi-naslov"
        className={cn(
          displayHeading,
          "max-w-[820px] text-[clamp(36px,4.4vw,60px)]",
        )}
      >
        Isti podaci, tri pogleda. Filtri idu s vama.
      </h2>
      <p className="mt-[22px] max-w-[620px] text-lg text-ink-2">
        Odaberite profile, pojedine račune i status jednom – Pregled, Kalendar
        i Statistika prikazat će točno taj izbor, sa zbrojem samo onoga što
        vidite.
      </p>

      <div className="mt-[52px] flex flex-wrap gap-5">
        <CalendarTeaser />
        <StatsTeaser />
      </div>
    </section>
  );
}
