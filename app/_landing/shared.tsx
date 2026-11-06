import { cn } from "@/lib/utils";

/** Page-width wrapper used by every landing section (1240px max, fluid gutter). */
export const container =
  "mx-auto w-full max-w-[1240px] px-[clamp(16px,4vw,40px)]";

/** Small uppercase mono label above headlines. */
export const eyebrow =
  "font-mono text-[13px] uppercase tracking-[0.08em] text-muted-foreground";

/** Big Bricolage section headline; size is set per section. */
export const displayHeading =
  "font-display font-extrabold leading-[1.02] tracking-[-0.03em]";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** Solid ink call-to-action; padding and font size are set per use. */
export const inkButton = cn(
  "inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink font-semibold text-white transition-colors hover:bg-ink-2",
  focusRing,
);

/** Demo profiles shown throughout the illustrations. */
export const PROFILES = {
  stan: { name: "Stan Trešnjevka", city: "Zagreb", color: "#3360E0" },
  brac: { name: "Kuća Brač", city: "Supetar", color: "#009B85" },
  mama: { name: "Mama", city: "Rijeka", color: "#8A4FD6" },
} as const;

/** Round colour swatch for a profile. Size comes from `className`. */
export function Dot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}
