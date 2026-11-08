import { LogoMark } from "@/components/brand/Logo";
import { longToday } from "@/lib/format";

/** Logo, today's date and optional actions across the top of the new tab. */
export function TopBar({
  today,
  children,
}: {
  today?: Date;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <LogoMark />
        <span className="font-display text-xl font-extrabold tracking-tight">
          fiskalio
        </span>
        {today && (
          <span className="ml-2 font-mono text-[13px] text-muted-foreground">
            {longToday(today)}
          </span>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2.5">{children}</div>
      )}
    </header>
  );
}
