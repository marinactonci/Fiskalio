/**
 * One-off clean-up of instance notes, used by convex/migrations.ts.
 *
 * Before the "Datum plaćanja" field existed, payment dates were typed into the
 * note ("Plaćeno 5.11.2025."). This module decides, per instance, how to move
 * that date into `paidAt` and what the note should say afterwards
 * ("Račun za razdoblje 1.10.2026. - 31.10.2026."). It is pure so it can be
 * checked against exported data before anything is written.
 *
 * It is deliberately strict: only a line that is exactly "Plaćeno <datum>" is
 * migrated, and only when the rest of the note is empty, the old cron text or
 * a few known harmless lines (billing range, invoice number, reference).
 * Text the user typed is never thrown away. Anything unclear is skipped or
 * listed for review, never guessed.
 */
import { parseBillingMonthStrict, periodNote } from "./format";

export interface NoteMigrationInput {
  description?: string;
  /** "yyyy-MM-dd" */
  dueDate: string;
  /** Billing period, "October 2026" (or "2026-10"). */
  month: string;
  isPaid: boolean;
  paidAt?: number;
}

export interface NoteMigrationOptions {
  /**
   * Name of the instance's bill. Old English cron notes are only replaced
   * when they carry exactly this name.
   */
  billName?: string;
  /** Also rewrite empty notes and old English cron notes (default true). */
  rewriteOther?: boolean;
}

export type NoteMigrationKind =
  /** "Plaćeno …" line moved into paidAt. */
  | "paid-note"
  /** Old English cron note ("X's monthly instance for October 2025"). */
  | "legacy-note"
  /** Empty note filled with the period text. */
  | "empty-note";

export type NoteMigrationPlan =
  /** Nothing to do. `review` is set when the note deserves a look by hand. */
  | { action: "none"; review?: string }
  | {
      action: "patch";
      kind: NoteMigrationKind;
      patch: { description?: string; isPaid?: boolean; paidAt?: number };
      /** "yyyy-MM-dd" when a payment date was read from the note. */
      paidDate?: string;
      /** Things worth a second look in the report (the change is still made). */
      notes: string[];
    }
  | { action: "skip"; reason: string };

const PAID_WORD = "(?:[-*•] ?)?u?pla[cćč]eno\\b";

/** A line that records a payment: "Plaćeno 5.11.2025.", "- uplaćeno: 05.11.25" … */
const PAID_LINE = new RegExp(`^\\s*${PAID_WORD}`, "i");

/**
 * Matched against the paid line after whitespace runs are collapsed to one
 * space (keeps the regex linear). "Plaćeno", optional ":"/","/dash, at most
 * two of "je"/"dana", an optional "(", then day SEP month and an optional SEP
 * year (same separator): four or two digits, or the "202.5" typo of a
 * misplaced dot; then an optional final dot.
 */
const PAID_DATE = new RegExp(
  `^ ?${PAID_WORD}[ :,–—-]*(?:(?:je|dana)[:,]? ){0,2}\\(? ?` +
    "(\\d{1,2}) ?([./-]) ?(\\d{1,2}) ?(?:\\2 ?(\\d{4}|\\d{3}\\.\\d|\\d{2})(?!\\d))? ?(\\.?)",
  "i",
);

/** Letters on both sides count as one word (JS \b ignores č, ć, š, ž, đ). */
const word = (w: string) => `(?<!\\p{L})(?:${w})(?!\\p{L})`;

/**
 * The only kinds of other lines a paid note may have and still be migrated.
 * Anything else — a correction, a refund, a reminder, any free text — could
 * contradict the paid line, and no word list can catch every way of saying
 * so, so such notes are skipped for the user to handle by hand.
 */
const SAFE_OTHER_LINES = [
  // "Obračun za razdoblje 01.03.2025 - 31.08.2025."
  /^\s*(?:obra[cč]un|ra[cč]un)?\s*za razdoblje\s+\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4}\.?\s*[-–—]\s*\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4}\.?\s*$/i,
  // "Račun br. 12345", "Račun broj: 2026-11/77"
  /^\s*ra[cč]un\s+(?:br\.?|broj)\s*:?\s*[\w/-]+\.?\s*$/i,
  // "Poziv na broj HR01 1234-5678"
  /^\s*poziv na broj\s*:?\s*(?:HR\d{2}\s+)?[\d -]+\.?\s*$/i,
];

/** Words that suggest a note is about a payment, for the review list. */
const PAYMENT_HINT = new RegExp(
  "pla[cćč]|plat|uplat|uplać|podmir|paid|pay|pla.eno|pl[cćč]eno|pal[cćč]eno|" +
    "izvr[sš]en|rije[sš]en|nalog|skinuto|tere[cćč]en|✓|✅|" +
    word("pl"),
  "iu",
);

const LEGACY_NOTE = /^(.+)'s monthly instance for ([A-Za-z]+ \d{4})$/;

const DAY_MS = 86_400_000;
/** Paid more than this many days before the due date looks wrong. */
const MAX_DAYS_EARLY = 60;
/** …or more than this many days after it. */
const MAX_DAYS_LATE = 180;
/** Longer paid lines are not a plain "Plaćeno <datum>". */
const MAX_PAID_LINE = 200;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function utcDay(y: number, m: number, d: number) {
  return Date.UTC(y, m - 1, d);
}

/** Calendar date validity (rejects 31.2.). */
function isValidDate(y: number, m: number, d: number) {
  if (!Number.isInteger(y) || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Last Sunday of a month, as a UTC day number (ms). */
function lastSundayUtc(y: number, monthIndex: number) {
  const last = new Date(Date.UTC(y, monthIndex + 1, 0));
  return Date.UTC(y, monthIndex, last.getUTCDate() - last.getUTCDay());
}

/**
 * Today's calendar date in Zagreb as UTC midnight (ms). EU summer time runs
 * from 01:00 UTC on the last Sunday of March to 01:00 UTC on the last Sunday
 * of October (UTC+2), otherwise UTC+1.
 */
function zagrebToday(nowMs: number) {
  const y = new Date(nowMs).getUTCFullYear();
  const summer =
    nowMs >= lastSundayUtc(y, 2) + 3_600_000 && nowMs < lastSundayUtc(y, 9) + 3_600_000;
  const local = nowMs + (summer ? 2 : 1) * 3_600_000;
  return Math.floor(local / DAY_MS) * DAY_MS;
}

function parseDue(due: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return null;
  const [y, m, d] = due.split("-").map(Number);
  return isValidDate(y, m, d) ? { y, m, d } : null;
}

/**
 * Reads the payment date from one "Plaćeno …" line, or says why not. Any text
 * left on the line besides the date (amounts, "djelomično", a second date, a
 * question mark, a payment method…) makes the line unclear.
 */
export function parsePaidLine(
  rawLine: string,
  dueDate: string,
): { y: number; m: number; d: number; fixes: string[] } | { error: string } {
  if (rawLine.length > MAX_PAID_LINE) return { error: "predugačak redak „Plaćeno”" };
  const line = rawLine.normalize("NFC").replace(/\s+/g, " ");
  const match = line.match(PAID_DATE);
  if (!match) return { error: "iza „Plaćeno” ne slijedi datum" };
  const [, dayS, sep, monthS, yearS, finalDot] = match;
  const d = Number(dayS);
  const m = Number(monthS);
  const fixes: string[] = [];

  let leftover = line
    .slice(match[0].length)
    .replace(/[\s.,;:()–—-]+/g, " ")
    .trim();
  // "5.3.2026. g." / "5.3.2026. godine" is still just the date.
  if (yearS?.length === 4 && /^(g|god|godine)$/i.test(leftover)) leftover = "";
  if (leftover) return { error: `uz datum stoji i „${leftover}”` };

  const due = parseDue(dueDate);
  if (!due) return { error: `neispravno dospijeće „${dueDate}”` };

  let y: number;
  if (yearS) {
    const digits = yearS.replace(".", "");
    if (digits !== yearS) fixes.push(`godina „${yearS}” pročitana kao ${digits}`);
    if (digits.length === 4) y = Number(digits);
    else {
      y = 2000 + Number(digits);
      fixes.push(`dvoznamenkasta godina „${digits}”`);
    }
  } else {
    // Without a year only the Croatian "d.m." form counts; "10.03" or "1/2"
    // are more likely amounts or fractions than dates.
    if (sep !== "." || finalDot !== ".") return { error: "datum bez godine nije u obliku „d.m.”" };
    // Take the year that puts the date closest to the due date.
    const candidates = [due.y - 1, due.y, due.y + 1].filter((cy) => isValidDate(cy, m, d));
    if (!candidates.length) return { error: `nepostojeći datum ${d}.${m}.` };
    const dueT = utcDay(due.y, due.m, due.d);
    y = candidates.reduce((best, cy) =>
      Math.abs(utcDay(cy, m, d) - dueT) < Math.abs(utcDay(best, m, d) - dueT) ? cy : best,
    );
    fixes.push(`godina nije upisana, uzeta ${y}`);
  }
  if (!isValidDate(y, m, d)) return { error: `nepostojeći datum ${d}.${m}.${y}.` };
  if (sep !== "." && d <= 12 && m <= 12 && d !== m)
    fixes.push(`„${dayS}${sep}${monthS}” pročitano kao ${d}. dan ${m}. mjeseca`);
  return { y, m, d, fixes };
}

/**
 * The old English cron note of this instance: "<bill>'s monthly instance for
 * <its month>". "exact" only when the prefix is the bill's own name; "other"
 * when it has that shape but anything else in front (user text, a renamed
 * bill) — such notes are never replaced, only listed for review.
 */
function legacyMatch(
  text: string,
  month: string,
  billName: string | undefined,
): "exact" | "other" | false {
  const m = text.trim().match(LEGACY_NOTE);
  // A one-line note that looks like cron text but doesn't parse (curly
  // apostrophe, line break inside) still deserves a look.
  if (!m) return !/[\r\n]/.test(text.trim()) && /monthly instance for/i.test(text) ? "other" : false;
  const noteMonth = parseBillingMonthStrict(m[2]);
  const instMonth = parseBillingMonthStrict(month);
  const sameMonth = !!noteMonth && !!instMonth && noteMonth.getTime() === instMonth.getTime();
  // Compare names ignoring Unicode form and the kind/amount of whitespace.
  const norm = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim();
  const sameName = billName !== undefined && norm(m[1]) === norm(billName);
  return sameMonth && sameName ? "exact" : "other";
}

function periodText(month: string): string | null {
  const period = parseBillingMonthStrict(month);
  return period ? periodNote(period) : null;
}

export function planNoteMigration(
  inst: NoteMigrationInput,
  nowMs: number,
  opts: NoteMigrationOptions = {},
): NoteMigrationPlan {
  const rewriteOther = opts.rewriteOther ?? true;
  const original = inst.description ?? "";
  const period = periodText(inst.month);

  if (!original.trim()) {
    if (!rewriteOther) return { action: "none" };
    if (!period) return { action: "skip", reason: `nepoznato razdoblje „${inst.month}”` };
    return { action: "patch", kind: "empty-note", patch: { description: period }, notes: [] };
  }

  const legacy = legacyMatch(original, inst.month, opts.billName);
  if (legacy === "exact") {
    if (!rewriteOther) return { action: "none" };
    if (!period) return { action: "skip", reason: `nepoznato razdoblje „${inst.month}”` };
    return { action: "patch", kind: "legacy-note", patch: { description: period }, notes: [] };
  }
  if (legacy === "other") {
    return {
      action: "none",
      review: "stara engleska bilješka s drugim imenom, mjesecom ili dodanim tekstom",
    };
  }

  // Lines with the exact separator that follows each, so kept text is
  // rejoined byte for byte. Matching uses an NFC copy ("ć" may be decomposed).
  const parts = original.split(/(\r?\n)/);
  const lines: { text: string; sep: string }[] = [];
  for (let i = 0; i < parts.length; i += 2) lines.push({ text: parts[i], sep: parts[i + 1] ?? "" });

  const paidIdx = lines
    .map((l, i) => (PAID_LINE.test(l.text.normalize("NFC")) ? i : -1))
    .filter((i) => i >= 0);
  if (paidIdx.length === 0) {
    return PAYMENT_HINT.test(original.normalize("NFC"))
      ? { action: "none", review: "spominje plaćanje, ali nije u obliku „Plaćeno <datum>”" }
      : { action: "none" };
  }
  if (paidIdx.length > 1) return { action: "skip", reason: "više redaka „Plaćeno” u bilješci" };

  // A date recorded through the new field wins; leave such notes alone.
  if (inst.paidAt) return { action: "skip", reason: "datum plaćanja je već upisan u polje" };
  // The note says paid but the instance says not: let the user decide.
  if (!inst.isPaid)
    return { action: "skip", reason: "bilješka kaže „Plaćeno”, a uplata je označena kao neplaćena" };

  const periodStart = parseBillingMonthStrict(inst.month);
  if (!periodStart || !period) return { action: "skip", reason: `nepoznato razdoblje „${inst.month}”` };

  const parsed = parsePaidLine(lines[paidIdx[0]].text, inst.dueDate);
  if ("error" in parsed) return { action: "skip", reason: parsed.error };

  const notes = [...parsed.fixes];
  const label = `${parsed.d}.${parsed.m}.${parsed.y}.`;
  const paidT = utcDay(parsed.y, parsed.m, parsed.d);
  const due = parseDue(inst.dueDate)!; // checked by parsePaidLine
  const diff = Math.round((paidT - utcDay(due.y, due.m, due.d)) / DAY_MS);
  if (diff < -MAX_DAYS_EARLY || diff > MAX_DAYS_LATE)
    return {
      action: "skip",
      reason: `datum ${label} je ${Math.abs(diff)} dana ${diff < 0 ? "prije" : "nakon"} dospijeća`,
    };
  const periodStartT = Date.UTC(periodStart.getFullYear(), periodStart.getMonth(), 1);
  if (paidT < periodStartT)
    return { action: "skip", reason: `datum ${label} je prije početka razdoblja računa` };
  if (paidT > periodStartT + 366 * DAY_MS)
    return { action: "skip", reason: `datum ${label} je više od godinu dana nakon početka razdoblja` };
  if (diff < -14) notes.push(`plaćeno ${-diff} dana prije dospijeća`);
  if (diff > 30) notes.push(`plaćeno ${diff} dana nakon dospijeća`);

  if (paidT > zagrebToday(nowMs)) return { action: "skip", reason: `datum ${label} je u budućnosti` };

  // The rest of the note, as typed, minus blank lines at either end.
  const kept = lines.filter((_, i) => i !== paidIdx[0]);
  let start = 0;
  let end = kept.length;
  while (start < end && !kept[start].text.trim()) start++;
  while (end > start && !kept[end - 1].text.trim()) end--;
  const restLines = kept.slice(start, end);
  const rest = restLines.map((l, i) => (i < restLines.length - 1 ? l.text + l.sep : l.text)).join("");
  // Only the exact old cron text of this bill and month counts as disposable.
  const restIsLegacy = !!rest.trim() && legacyMatch(rest, inst.month, opts.billName) === "exact";

  if (rest.trim() && !restIsLegacy) {
    const unsafe = restLines.find(
      (l) => l.text.trim() && !SAFE_OTHER_LINES.some((re) => re.test(l.text.normalize("NFC"))),
    );
    if (unsafe)
      return { action: "skip", reason: `bilješka ima i drugi tekst („${unsafe.text.trim().slice(0, 60)}”)` };
    notes.push("ostali tekst bilješke je zadržan");
  }

  // Remove the paid line; other text stays as typed. A note left with nothing,
  // or only the old English cron text, gets the period text.
  let description: string;
  if (!rest.trim() || (restIsLegacy && rewriteOther)) {
    if (restIsLegacy) notes.push("zamijenjena i stara engleska bilješka");
    description = period;
  } else {
    description = rest;
  }

  return {
    action: "patch",
    kind: "paid-note",
    patch: {
      ...(description !== original ? { description } : {}),
      isPaid: true,
      // Noon UTC keeps the same calendar day in every European time zone.
      paidAt: Date.UTC(parsed.y, parsed.m - 1, parsed.d, 12),
    },
    paidDate: `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`,
    notes,
  };
}
