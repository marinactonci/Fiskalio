import { cn } from "@/lib/utils";
import { container, eyebrow } from "./shared";

const AUDIENCES = [
  "Za jedan stan.",
  "Za stan i kuću na moru.",
  "Za mamine račune koje plaćate vi.",
];

/** "Za koga" strip under the hero. */
export function Audience() {
  return (
    <section
      aria-labelledby="za-koga"
      className="border-y border-line bg-card"
    >
      <div
        className={cn(
          container,
          "flex flex-wrap items-baseline gap-x-12 gap-y-[18px] py-[34px]",
        )}
      >
        <h2 id="za-koga" className={eyebrow}>
          Za koga
        </h2>
        {AUDIENCES.map((text) => (
          <p
            key={text}
            className="font-display text-[26px] font-bold tracking-[-0.02em]"
          >
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
