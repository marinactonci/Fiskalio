import { cn } from "@/lib/utils";
import { container } from "./shared";

const ITEMS = [
  {
    title: "Nije banka.",
    body: "Ne plaća umjesto vas i ne traži pristup bankovnom računu. Vi plaćate kako ste navikli.",
  },
  {
    title: "Ne čita vaš e-mail.",
    body: "Iznose upisujete vi (ili ih Fiskalio prepiše iz prošlog mjeseca). Nikakvog skeniranja pošte.",
  },
  {
    title: "Nije knjigovodstvo.",
    body: "Napravljen je za kućne račune i režije, ne za fakture tvrtke.",
  },
];

/** "Što Fiskalio nije" – expectation-setting block. */
export function WhatItIsNot() {
  return (
    <section
      aria-labelledby="nije-naslov"
      className={cn(container, "pt-[72px] pb-20 md:pb-26")}
    >
      <div className="flex flex-wrap gap-x-14 gap-y-7 border-t-2 border-ink pt-7">
        <h2
          id="nije-naslov"
          className="flex-[1_1_260px] font-display text-[34px] leading-[1.05] font-extrabold tracking-[-0.02em]"
        >
          Što Fiskalio nije
        </h2>
        <div className="grid min-w-0 flex-[3_1_600px] grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-7">
          {ITEMS.map((item) => (
            <div key={item.title}>
              <h3 className="text-lg font-bold">{item.title}</h3>
              <p className="mt-1.5 text-ink-2">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
