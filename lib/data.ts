import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import {
  addDays,
  monthLabel,
  parseBillingMonth,
  parseISODate,
  startOfDay,
  toMonthKey,
  weekdayIndex,
} from "@/lib/format";

type OverviewResult = FunctionReturnType<typeof api.billInstances.getOverview>;
export type OverviewData = Extract<OverviewResult, { success: true }>["data"];

export type OProfile = OverviewData["profiles"][number];
export type OBill = OverviewData["bills"][number];
export type OInstance = OverviewData["instances"][number];

export type InstanceStatus = "paid" | "late" | "due";

export interface Item extends OInstance {
  bill: OBill;
  profile: OProfile;
  due: Date;
  /** "2026-11" — month of the due date; views are organised by due date. */
  dueMonth: string;
  /** Billing period (what the bill is for), if parseable. */
  period: Date | null;
  status: InstanceStatus;
}

export interface Model {
  profiles: OProfile[];
  /** All bills, archived included (their history still shows everywhere). */
  bills: OBill[];
  /** Bills that still get new monthly instances. */
  activeBills: OBill[];
  items: Item[];
  profileById: Map<string, OProfile>;
  billById: Map<string, OBill>;
  today: Date;
}

const FALLBACK_PROFILE: OProfile = {
  _id: "unknown" as OProfile["_id"],
  _creationTime: 0,
  name: "Bez profila",
  color: "#8A8F99",
  address: { street: "", city: "", country: "" },
};

export function buildModel(data: OverviewData, now = new Date()): Model {
  const today = startOfDay(now);
  const profiles = [...data.profiles].sort(
    (a, b) => a._creationTime - b._creationTime,
  );
  const profileById = new Map(profiles.map((p) => [p._id as string, p]));
  const bills = [...data.bills].sort((a, b) =>
    a.name.localeCompare(b.name, "hr"),
  );
  const billById = new Map(bills.map((b) => [b._id as string, b]));

  const items: Item[] = [];
  for (const inst of data.instances) {
    const bill = billById.get(inst.billId);
    if (!bill) continue;
    const profile = profileById.get(bill.profileId) ?? FALLBACK_PROFILE;
    const due = parseISODate(inst.dueDate);
    const status: InstanceStatus = inst.isPaid
      ? "paid"
      : due < today
        ? "late"
        : "due";
    items.push({
      ...inst,
      bill,
      profile,
      due,
      dueMonth: toMonthKey(due),
      period: parseBillingMonth(inst.month),
      status,
    });
  }
  items.sort((a, b) => a.due.getTime() - b.due.getTime());

  const activeBills = bills.filter((b) => !b.archivedAt);

  return { profiles, bills, activeBills, items, profileById, billById, today };
}

/**
 * Day of the month the next monthly instance will be due, as the cron picks
 * it: the bill's fixed day, else the day of its latest instance.
 * `history` is the bill's instances ordered oldest → newest.
 */
export function nextDueDay(
  bill: OBill,
  history: Item[],
): { day: number; source: "bill" | "last" | "default" } {
  if (bill.dueDay) return { day: bill.dueDay, source: "bill" };
  const last = history[history.length - 1];
  if (last) return { day: last.due.getDate(), source: "last" };
  return { day: 1, source: "default" };
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export type StatusFilter = "all" | "unpaid" | "late" | "paid";

export interface Filters {
  status: StatusFilter;
  profiles: string[];
  bills: string[];
}

export const EMPTY_FILTERS: Filters = { status: "all", profiles: [], bills: [] };

const STATUSES: StatusFilter[] = ["all", "unpaid", "late", "paid"];

export function parseFilters(params: URLSearchParams): Filters {
  const status = params.get("status") as StatusFilter | null;
  const list = (k: string) =>
    (params.get(k) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return {
    status: status && STATUSES.includes(status) ? status : "all",
    profiles: list("profiles"),
    bills: list("bills"),
  };
}

/** Writes filter keys into a copy of `params`, leaving other keys intact. */
export function writeFilters(
  params: URLSearchParams,
  f: Filters,
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (f.status === "all") next.delete("status");
  else next.set("status", f.status);
  if (f.profiles.length) next.set("profiles", f.profiles.join(","));
  else next.delete("profiles");
  if (f.bills.length) next.set("bills", f.bills.join(","));
  else next.delete("bills");
  return next;
}

export function filtersToQuery(f: Filters): string {
  return writeFilters(new URLSearchParams(), f).toString();
}

export function hasActiveFilters(f: Filters): boolean {
  return f.status !== "all" || f.profiles.length > 0 || f.bills.length > 0;
}

/** Profile + bill scope (everything except status). */
export function inScope(item: Item, f: Filters): boolean {
  if (f.profiles.length && !f.profiles.includes(item.profile._id)) return false;
  if (f.bills.length && !f.bills.includes(item.bill._id)) return false;
  return true;
}

export function matchesStatus(item: Item, s: StatusFilter): boolean {
  switch (s) {
    case "unpaid":
      return item.status !== "paid";
    case "late":
      return item.status === "late";
    case "paid":
      return item.status === "paid";
    default:
      return true;
  }
}

export function applyFilters(items: Item[], f: Filters): Item[] {
  return items.filter((i) => inScope(i, f) && matchesStatus(i, f.status));
}

/* ------------------------------------------------------------------ */
/* Aggregates                                                          */
/* ------------------------------------------------------------------ */

export function sum(items: { amount: number }[]): number {
  return items.reduce((a, i) => a + i.amount, 0);
}

export interface Totals {
  total: number;
  paid: number;
  late: number;
  due: number;
  count: number;
  paidCount: number;
  lateCount: number;
  dueCount: number;
}

export function totals(items: Item[]): Totals {
  const t: Totals = {
    total: 0,
    paid: 0,
    late: 0,
    due: 0,
    count: items.length,
    paidCount: 0,
    lateCount: 0,
    dueCount: 0,
  };
  for (const i of items) {
    t.total += i.amount;
    if (i.status === "paid") {
      t.paid += i.amount;
      t.paidCount++;
    } else if (i.status === "late") {
      t.late += i.amount;
      t.lateCount++;
    } else {
      t.due += i.amount;
      t.dueCount++;
    }
  }
  return t;
}

export function byProfile(items: Item[], profiles: OProfile[]) {
  const total = sum(items);
  return profiles
    .map((p) => {
      const v = sum(items.filter((i) => i.profile._id === p._id));
      return { profile: p, value: v, pct: total > 0 ? (v / total) * 100 : 0 };
    })
    .filter((r) => r.value > 0);
}

/** Instances of a bill ordered oldest → newest by due date. */
export function billHistory(items: Item[], billId: string): Item[] {
  return items.filter((i) => i.bill._id === billId);
}

/** Amount of the bill's latest instance, used to prefill a new one. */
export function lastAmountFor(items: Item[], billId: string): number | undefined {
  const hist = billHistory(items, billId);
  return hist.length ? hist[hist.length - 1].amount : undefined;
}

/* ------------------------------------------------------------------ */
/* Open items ("Na redu")                                              */
/* ------------------------------------------------------------------ */

/** Unpaid items to act on: everything late plus what is due by month end + 14 days. */
export function openItems(items: Item[], today: Date): Item[] {
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const limit = addDays(monthEnd, 14);
  return items.filter((i) => i.status !== "paid" && i.due <= limit);
}

export interface OpenGroup {
  key: "late" | "thisWeek" | "nextWeek" | "later";
  title: string;
  tone?: "late";
  items: Item[];
}

/** Late, this week (to Sunday), next week, later. Empty groups are dropped. */
export function groupOpenItems(open: Item[], today: Date): OpenGroup[] {
  const weekEnd = addDays(today, 6 - weekdayIndex(today));
  const nextWeekEnd = addDays(weekEnd, 7);
  const groups: OpenGroup[] = [
    { key: "late", title: "Kasni", tone: "late", items: open.filter((i) => i.status === "late") },
    {
      key: "thisWeek",
      title: "Ovaj tjedan",
      items: open.filter((i) => i.status === "due" && i.due <= weekEnd),
    },
    {
      key: "nextWeek",
      title: "Sljedeći tjedan",
      items: open.filter((i) => i.status === "due" && i.due > weekEnd && i.due <= nextWeekEnd),
    },
    {
      key: "later",
      title: "Kasnije",
      items: open.filter((i) => i.status === "due" && i.due > nextWeekEnd),
    },
  ];
  return groups.filter((g) => g.items.length > 0);
}

/** Splits items by due month in order of appearance: "listopad 2026", "studeni 2026". */
export function groupByDueMonth(items: Item[]): { key: string; label: string; items: Item[] }[] {
  const months = new Map<string, Item[]>();
  for (const item of items) {
    const list = months.get(item.dueMonth) ?? [];
    list.push(item);
    months.set(item.dueMonth, list);
  }
  return Array.from(months, ([key, list]) => ({ key, label: monthLabel(list[0].due), items: list }));
}

/** Change of the latest instance vs the one before it, per bill. */
export function lastChange(history: Item[]) {
  if (history.length < 2) return null;
  const cur = history[history.length - 1];
  const prev = history[history.length - 2];
  if (prev.amount <= 0) return null;
  return {
    current: cur,
    previous: prev,
    diff: cur.amount - prev.amount,
    pct: ((cur.amount - prev.amount) / prev.amount) * 100,
  };
}

export const PROFILE_COLORS = [
  "#3360E0",
  "#009B85",
  "#8A4FD6",
  "#475569",
  "#B5179E",
  "#2F7D32",
  "#A16207",
  "#0E7490",
];
