import { cn } from "@/lib/utils";
import { container, displayHeading } from "./shared";

const STEPS = [
  {
    date: "31.10.",
    title: "Listopad se zatvara",
    detail: "HEP struja · 52,10 € · plaćeno",
  },
  {
    date: "01.11.",
    title: "Otvara se studeni – za sve račune odjednom",
    detail: "HEP struja · 52,10 € (procjena) · dospijeće 15.11.",
    highlight: true,
  },
  {
    date: "06.11.",
    title: "Stigne pravi račun – ispravite iznos",
    detail: "52,10 € → 48,60 € · sve ostalo već je upisano",
  },
  {
    date: "12.11.",
    title: "Platili ste – označite jednim klikom",
    detail: "Zbrojevi, kalendar i statistika osvježe se odmah.",
  },
];

/** Dark "Automatika" section with the month-rollover timeline. */
export function Automation() {
  return (
    <section
      id="automatika"
      aria-labelledby="automatika-naslov"
      className="bg-ink text-white"
    >
      <div className={cn(container, "flex flex-wrap gap-14 py-20 md:py-26")}>
        <div className="min-w-0 flex-[1_1_380px]">
          <p className="mb-[18px] font-mono text-[15px] text-lime">
            01. u mjesecu, 00:01
          </p>
          <h2
            id="automatika-naslov"
            className={cn(displayHeading, "text-[clamp(36px,4.4vw,58px)]")}
          >
            Dok spavate, novi mjesec se sam složi.
          </h2>
          <p className="mt-6 max-w-[460px] text-lg text-[#D5D7DC]">
            Za svaki račun Fiskalio otvori uplatu za novi mjesec, prepiše
            prošlomjesečni iznos kao procjenu i pomakne datum dospijeća.
            Duplikata nema – ako uplata već postoji, ostaje netaknuta.
          </p>
        </div>

        <ol className="flex min-w-0 flex-[1.3_1_480px] flex-col">
          {STEPS.map((step) => (
            <li
              key={step.date}
              className="flex gap-5 border-b border-[#2E323A] py-[22px] last:border-b-0"
            >
              <span
                className={cn(
                  "w-[60px] flex-none pt-[3px] font-mono text-sm sm:w-[92px]",
                  step.highlight ? "text-lime" : "text-[#B9BCC4]",
                )}
              >
                {step.date}
              </span>
              <div>
                <p className="text-lg font-semibold">{step.title}</p>
                <p className="mt-1 text-[#B9BCC4]">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
