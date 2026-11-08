/**
 * Static illustration for the right-hand panel of the auth pages. It shows
 * sample data only, so it is hidden from assistive technology.
 */
const SAMPLE_BILLS = [
  {
    name: "A1 internet",
    dot: "#3360E0",
    late: true,
    meta: null,
    amount: "32,99 €",
  },
  {
    name: "Telemach",
    dot: "#8A4FD6",
    late: false,
    meta: "sub 7.11.",
    amount: "24,99 €",
  },
  {
    name: "Voda",
    dot: "#3360E0",
    late: false,
    meta: "uto 10.11.",
    amount: "21,45 €",
  },
];

export function MonthPreview() {
  return (
    <aside
      aria-hidden="true"
      className="hidden min-w-0 flex-1 flex-col justify-center gap-9 bg-ink p-[clamp(32px,5vw,72px)] text-white lg:flex"
    >
      <p className="max-w-115 font-display text-[34px] leading-[1.12] font-bold tracking-[-0.02em]">
        Studeni je već otvoren. Svi računi čekaju na svom mjestu.
      </p>

      <div className="max-w-115 rounded-[18px] bg-[#23262D] p-5.5">
        <div className="flex items-baseline justify-between gap-3 font-mono text-[13px]">
          <span className="text-[#B9BCC4]">STUDENI 2026 · SVI PROFILI</span>
          <span className="text-lime">3 / 11 plaćeno</span>
        </div>
        <div className="mt-3.5 flex h-2 overflow-hidden rounded-full bg-ink-2">
          <span className="w-[27%] bg-lime" />
        </div>
        <div className="mt-4.5 flex flex-col gap-1 text-sm">
          {SAMPLE_BILLS.map((bill, i) => (
            <div
              key={bill.name}
              className={
                "flex items-center gap-2.5 py-2.5" +
                (i < SAMPLE_BILLS.length - 1
                  ? " border-b border-[#2E323A]"
                  : "")
              }
            >
              <span
                className="size-2 rounded-full"
                style={{ background: bill.dot }}
              />
              {bill.name}
              {bill.late ? (
                <span className="rounded-full bg-late-bg px-2 py-0.5 text-[11px] font-semibold text-late">
                  KASNI
                </span>
              ) : (
                <span className="text-xs text-[#B9BCC4]">{bill.meta}</span>
              )}
              <span className="ml-auto font-mono">{bill.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
