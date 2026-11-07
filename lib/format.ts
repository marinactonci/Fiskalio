const moneyFmt = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const amountFmt = new Intl.NumberFormat("hr-HR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234.5 → "1.234,50 €" */
export function formatMoney(n: number): string {
  return moneyFmt.format(n).replace(/ /g, " ");
}

/** 48.6 → "48,60" (no currency sign, for dense places like calendar cells) */
export function formatAmount(n: number): string {
  return amountFmt.format(n);
}

/** Signed percentage with a real minus sign: -4.21 → "−4,2 %" */
export function formatPercent(n: number, digits = 1): string {
  const sign = n > 0.05 ? "+" : n < -0.05 ? "−" : "±";
  return `${sign}${Math.abs(n).toFixed(digits).replace(".", ",")} %`;
}

export const MONTHS_HR = [
  "siječanj",
  "veljača",
  "ožujak",
  "travanj",
  "svibanj",
  "lipanj",
  "srpanj",
  "kolovoz",
  "rujan",
  "listopad",
  "studeni",
  "prosinac",
];

/** Genitive month names used in dates: "6. studenoga". */
export const MONTHS_HR_GEN = [
  "siječnja",
  "veljače",
  "ožujka",
  "travnja",
  "svibnja",
  "lipnja",
  "srpnja",
  "kolovoza",
  "rujna",
  "listopada",
  "studenoga",
  "prosinca",
];

export const MONTHS_HR_SHORT = [
  "sij",
  "velj",
  "ožu",
  "tra",
  "svi",
  "lip",
  "srp",
  "kol",
  "ruj",
  "lis",
  "stu",
  "pro",
];

/** Monday-first. */
export const WEEKDAYS_HR_SHORT = ["pon", "uto", "sri", "čet", "pet", "sub", "ned"];
const WEEKDAYS_HR_LONG = [
  "ponedjeljak",
  "utorak",
  "srijeda",
  "četvrtak",
  "petak",
  "subota",
  "nedjelja",
];

const MONTHS_EN = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** Monday = 0 … Sunday = 6 */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** "2026-11-06" → local Date at midnight. */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Date → "2026-11-06" */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Date → "2026-11" */
export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-11" → Date (1st of month) or null */
export function parseMonthKey(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}$/.test(s)) return null;
  const [y, m] = s.split("-").map(Number);
  if (m < 1 || m > 12) return null;
  return new Date(y, m - 1, 1);
}

/**
 * Billing-period labels are stored as en-US "November 2026" (legacy format,
 * also written by the monthly cron). Accepts "yyyy-MM" too.
 */
export function parseBillingMonth(s: string): Date | null {
  const strict = parseBillingMonthStrict(s);
  if (strict) return strict;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Only the two stored formats ("November 2026", "2026-11"); unlike
 * parseBillingMonth it never falls back to Date() guessing, which reads e.g.
 * "Studeni 2026" as January.
 */
export function parseBillingMonthStrict(s: string): Date | null {
  const t = s.trim();
  const key = parseMonthKey(t);
  if (key) return key;
  const m = t.toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
  if (m) {
    const idx = MONTHS_EN.indexOf(m[1]);
    if (idx >= 0) return new Date(Number(m[2]), idx, 1);
  }
  return null;
}

/** Date → "November 2026" (storage format for billing periods). */
export function toBillingMonth(d: Date): string {
  const name = MONTHS_EN[d.getMonth()];
  return `${name[0].toUpperCase()}${name.slice(1)} ${d.getFullYear()}`;
}

/** "studeni 2026" */
export function monthLabel(d: Date): string {
  return `${MONTHS_HR[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Studeni 2026" */
export function monthTitle(d: Date): string {
  const l = monthLabel(d);
  return l[0].toUpperCase() + l.slice(1);
}

/** "stu 2026" */
export function monthShortLabel(d: Date): string {
  return `${MONTHS_HR_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** "6.11." */
export function dayMonth(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

/** "pet 6.11." */
export function shortDate(d: Date): string {
  return `${WEEKDAYS_HR_SHORT[weekdayIndex(d)]} ${dayMonth(d)}`;
}

/** "6.11.2026." */
export function fullDate(d: Date): string {
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
}

/**
 * Default note for an instance, from its billing period:
 * "Račun za razdoblje 1.10.2026. - 31.10.2026."
 * Also used by the monthly cron (convex/billInstances.ts).
 */
export function periodNote(period: Date): string {
  const first = new Date(period.getFullYear(), period.getMonth(), 1);
  const last = new Date(period.getFullYear(), period.getMonth() + 1, 0);
  return `Račun za razdoblje ${fullDate(first)} - ${fullDate(last)}`;
}

/** "2026-11-15" → 15 (day of month), or undefined if unparseable. */
export function dayOfISODate(s: string | undefined): number | undefined {
  const d = Number(s?.split("-")[2]);
  return Number.isInteger(d) && d >= 1 && d <= 31 ? d : undefined;
}

/** "Petak, 6. studenoga" */
export function longToday(d: Date): string {
  const w = WEEKDAYS_HR_LONG[weekdayIndex(d)];
  return `${w[0].toUpperCase()}${w.slice(1)}, ${d.getDate()}. ${MONTHS_HR_GEN[d.getMonth()]}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

/** Croatian plural: plural(5, "račun", "računa", "računa") */
export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** Relative due text: "danas", "sutra", "za 4 dana", "kasni 2 dana" */
export function relativeDue(due: Date, today: Date): string {
  const diff = daysBetween(today, due);
  if (diff === 0) return "danas";
  if (diff === 1) return "sutra";
  if (diff === -1) return "kasni 1 dan";
  if (diff < 0) return `kasni ${-diff} ${plural(-diff, "dan", "dana", "dana")}`;
  return `za ${diff} ${plural(diff, "dan", "dana", "dana")}`;
}
