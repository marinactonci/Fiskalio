import { cn } from "@/lib/utils";
import { container, displayHeading, focusRing } from "./shared";

const QUESTIONS = [
  {
    q: "Što ako se iznos računa promijeni?",
    a: "Automatski otvorena uplata nosi prošlomjesečni iznos kao procjenu. Kad stigne pravi račun, ispravite iznos u dva klika – iz kalendara, s pregleda ili iz detalja računa.",
  },
  {
    q: "Gdje se čuvaju podaci za prijavu na e-račune?",
    a: "Lozinke za portale e-računa šifriraju se (AES) prije spremanja i prikazuju samo vama, tek kad ih zatražite.",
  },
  {
    q: "Mogu li pratiti račune za više nekretnina ili osoba?",
    a: "Da – za to služe profili. Svaki ima svoju boju, a na kalendaru i u statistici možete gledati sve zajedno ili samo jedan.",
  },
  {
    q: "Mogu li izvesti ili obrisati svoje podatke?",
    a: "Da. U postavkama računa možete preuzeti sve uplate kao CSV ili trajno obrisati račun zajedno sa svim podacima.",
  },
];

/** FAQ built on native <details>, first item open. */
export function Faq() {
  return (
    <section
      id="pitanja"
      aria-labelledby="pitanja-naslov"
      className="border-t border-line bg-card"
    >
      <div
        className={cn(
          container,
          "flex flex-wrap gap-x-16 gap-y-10 py-20 md:py-24",
        )}
      >
        <h2
          id="pitanja-naslov"
          className={cn(
            displayHeading,
            "flex-[1_1_300px] text-[clamp(34px,4vw,52px)]",
          )}
        >
          Česta pitanja
        </h2>
        <div className="flex min-w-0 flex-[2_1_560px] flex-col">
          {QUESTIONS.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="group border-b border-line py-[22px]"
            >
              <summary
                className={cn(
                  "flex cursor-pointer list-none justify-between gap-4 rounded-sm text-lg font-semibold sm:text-[19px] [&::-webkit-details-marker]:hidden",
                  focusRing,
                )}
              >
                {item.q}
                <span
                  aria-hidden="true"
                  className="text-2xl leading-none transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-[620px] text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
