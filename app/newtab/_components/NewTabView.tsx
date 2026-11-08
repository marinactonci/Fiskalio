"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAppActions } from "@/components/app/AppActions";
import { Card, EmptyState, StatusPill } from "@/components/app/bits";
import { MonthGrid } from "@/components/app/MonthGrid";
import { sum, totals, type Item, type Model, type OProfile } from "@/lib/data";
import {
  MONTHS_HR,
  addMonths,
  formatMoney,
  monthTitle,
  parseISODate,
  plural,
  shortDate,
  toISODate,
  toMonthKey,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { OpenList } from "./OpenList";
import { QuickAdd } from "./QuickAdd";
import { QuickEdit } from "./QuickEdit";
import { TopBar } from "./TopBar";

type Panel =
  | { kind: "none" }
  | { kind: "item"; id: string }
  | { kind: "add"; dueDate: string };

const ONLY_UNPAID_KEY = "fiskalio:newtab:onlyUnpaid";

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // Storage blocked: the choice just isn't remembered.
  }
}

/** "Uplate za {month}": accusative, which differs from the nominative only for veljača. */
function monthAccusative(m: number): string {
  return m === 1 ? "veljaču" : MONTHS_HR[m];
}

/** The new-tab page: month calendar, quick edit panel, what's next and this month's total. */
export function NewTabView({ model }: { model: Model }) {
  const { openInstance } = useAppActions();
  const today = model.today;
  const currentKey = toMonthKey(today);

  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  // Only rendered on the client (after data loads), so storage can be read up front.
  const [onlyUnpaid, setOnlyUnpaid] = useState(() => readFlag(ONLY_UNPAID_KEY));
  const [panel, setPanel] = useState<Panel>({ kind: "none" });
  // Phones show dots instead of chips: tapping a day lists its payments.
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Where focus goes back to when a panel closes.
  const opener = useRef<HTMLElement | null>(null);

  const monthKey = toMonthKey(month);
  const monthItems = useMemo(
    () => model.items.filter((i) => i.dueMonth === monthKey),
    [model.items, monthKey],
  );
  const visible = useMemo(
    () =>
      onlyUnpaid ? monthItems.filter((i) => i.status !== "paid") : monthItems,
    [monthItems, onlyUnpaid],
  );
  // An instance deleted elsewhere simply closes its panel.
  const selected =
    panel.kind === "item"
      ? (model.items.find((i) => i._id === panel.id) ?? null)
      : null;

  const rememberOpener = () => {
    const el = document.activeElement;
    opener.current =
      el instanceof HTMLElement && el !== document.body ? el : null;
  };
  const close = useCallback(() => {
    setPanel({ kind: "none" });
    const el = opener.current;
    opener.current = null;
    if (el?.isConnected) requestAnimationFrame(() => el.focus());
  }, []);
  const goMonth = (d: Date) => {
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDay(null);
    setPanel({ kind: "none" });
  };
  const openItem = (i: Item) => {
    if (selected?._id === i._id) return close();
    rememberOpener();
    if (i.dueMonth !== monthKey) {
      setMonth(new Date(i.due.getFullYear(), i.due.getMonth(), 1));
      setSelectedDay(null);
    }
    setPanel({ kind: "item", id: i._id });
  };
  const addOn = (iso: string) => {
    rememberOpener();
    setPanel({ kind: "add", dueDate: iso });
  };

  // Escape closes the open panel, unless a dialog on top of it takes the key.
  const panelOpen = panel.kind !== "none";
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return;
      close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panelOpen, close]);

  const setFilter = (v: boolean) => {
    setOnlyUnpaid(v);
    writeFlag(ONLY_UNPAID_KEY, v);
  };

  const topActions = (
    <>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "outline" }), "h-10")}
      >
        Otvori Fiskalio
      </Link>
      {model.activeBills.length > 0 && (
        <Button className="h-10" onClick={() => addOn(toISODate(today))}>
          <Plus aria-hidden /> Nova uplata
        </Button>
      )}
    </>
  );

  if (model.profiles.length === 0) {
    return (
      <div className="mx-auto flex max-w-400 flex-col gap-6">
        <TopBar today={today}>{topActions}</TopBar>
        <EmptyState
          title="Krenimo od prvog profila"
          action={
            <Link href="/dashboard" className={buttonVariants()}>
              Otvori Fiskalio
            </Link>
          }
        >
          Profil je mjesto ili osoba za koju plaćate račune – npr. „Stan
          Trešnjevka” ili „Mama”. Dodajte ga u aplikaciji, a kalendar će se
          pojaviti ovdje.
        </EmptyState>
      </div>
    );
  }

  const summary = !monthItems.length
    ? "Još nema uplata"
    : onlyUnpaid
      ? `${visible.length} od ${monthItems.length} neplaćeno · zbroj ${formatMoney(sum(visible))}`
      : `${monthItems.length} ${plural(monthItems.length, "uplata", "uplate", "uplata")} · zbroj ${formatMoney(sum(monthItems))}`;
  const isFuture = monthKey > currentKey && model.activeBills.length > 0;

  return (
    <div className="mx-auto flex max-w-400 flex-col gap-4.5 lg:h-full">
      <TopBar today={today}>{topActions}</TopBar>

      <div className="flex flex-wrap items-start gap-5 lg:min-h-0 lg:flex-1 lg:flex-nowrap lg:items-stretch">
        <section
          aria-label="Kalendar"
          className="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5 lg:min-h-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="min-w-59 font-display text-[36px] leading-[1.05] font-extrabold tracking-tight">
                {monthTitle(month)}
              </h1>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Prethodni mjesec"
                  onClick={() => goMonth(addMonths(month, -1))}
                >
                  <ChevronLeft aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Sljedeći mjesec"
                  onClick={() => goMonth(addMonths(month, 1))}
                >
                  <ChevronRight aria-hidden />
                </Button>
                {monthKey !== currentKey && (
                  <Button
                    variant="outline"
                    className="h-10"
                    onClick={() => goMonth(today)}
                  >
                    Danas
                  </Button>
                )}
              </div>
              <span className="text-[13px] text-muted-foreground">
                {summary}
              </span>
            </div>
            <div
              role="group"
              aria-label="Prikaz"
              className="flex rounded-xl bg-secondary p-1"
            >
              {([false, true] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={onlyUnpaid === v}
                  onClick={() => setFilter(v)}
                  className={cn(
                    "h-8.5 rounded-lg px-3.5 text-[13px] font-semibold",
                    onlyUnpaid === v
                      ? "bg-card text-ink shadow-xs"
                      : "text-muted-foreground",
                  )}
                >
                  {v ? "Neplaćeno" : "Sve"}
                </button>
              ))}
            </div>
          </div>

          {isFuture && (
            <p className="rounded-[14px] bg-lime-soft px-4 py-3 text-[13px] leading-normal text-[#2A2E35]">
              Uplate za {monthAccusative(month.getMonth())} otvorit će se 1.
              {month.getMonth() + 1}. u 00:01, s iznosima iz prošlog mjeseca. Do
              tada ih možete dodati ručno.
            </p>
          )}

          <MonthGrid
            compact
            fill
            month={month}
            today={today}
            items={visible}
            selectedItemId={selected?._id ?? null}
            onOpenItem={openItem}
            onAddDay={addOn}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            footer={<Legend profiles={model.profiles} />}
          />

          {selectedDay && (
            <DayList
              day={selectedDay}
              items={visible.filter((i) => i.dueDate === selectedDay)}
              canAdd={model.activeBills.length > 0}
              onOpen={openItem}
              onAdd={() => addOn(selectedDay)}
            />
          )}
        </section>

        {/* Desktop: fixed width; "Na redu" absorbs the leftover height and scrolls. If an
            open panel still doesn't fit (short screens), the column itself scrolls. */}
        <aside
          aria-label="Na redu i sažetak"
          className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 lg:min-h-0 lg:flex-[0_0_360px] lg:overflow-y-auto lg:[scrollbar-width:thin]"
        >
          {selected && (
            <QuickEdit
              key={selected._id}
              item={selected}
              today={today}
              onClose={close}
              onMore={(amount) => openInstance({ item: selected, amount })}
            />
          )}
          {panel.kind === "add" && (
            <QuickAdd
              key={panel.dueDate}
              model={model}
              dueDate={panel.dueDate}
              onClose={close}
              onAdded={(id) => setPanel({ kind: "item", id })}
              onMore={(billId, amount) => {
                openInstance({ dueDate: panel.dueDate, billId, amount });
                close();
              }}
            />
          )}
          <MonthTotal model={model} today={today} />
          <OpenList
            model={model}
            today={today}
            selectedId={selected?._id ?? null}
            onOpen={openItem}
          />
          <NextMonth model={model} today={today} />
        </aside>
      </div>
    </div>
  );
}

function Legend({ profiles }: { profiles: OProfile[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4.5 gap-y-2 border-t border-line-soft px-4 py-3 text-xs text-muted-foreground lg:[@media(max-height:760px)]:hidden">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-4.5 rounded-[3px] border border-line border-l-[3px] border-l-ink-2 bg-card" />
        Čeka
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-4.5 rounded-[3px] border-l-[3px] border-l-ink-2 bg-late-bg" />
        Kasni
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-4.5 rounded-[3px] border-l-[3px] border-l-ink-2 bg-paid-bg" />
        Plaćeno
      </span>
      <span className="hidden md:inline">
        Lijevi rub = boja profila · klik na uplatu otvara brzo uređivanje
      </span>
      <span className="md:hidden">Dodirnite dan za njegove uplate</span>
      {profiles.length > 1 && (
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1 md:ml-auto">
          {profiles.map((p) => (
            <span key={p._id} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: p.color }}
                aria-hidden
              />
              {p.name}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

/** Phones: the tapped day's payments under the grid, plus "add" for that day. */
function DayList({
  day,
  items,
  canAdd,
  onOpen,
  onAdd,
}: {
  day: string;
  items: Item[];
  canAdd: boolean;
  onOpen: (item: Item) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 md:hidden">
      <p className="text-sm font-semibold">{shortDate(parseISODate(day))}</p>
      {items.length > 0 && (
        <Card className="overflow-hidden">
          <ul>
            {items.map((i) => (
              <li
                key={i._id}
                className="border-b border-line-soft last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onOpen(i)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#FAFAF7]"
                >
                  <span
                    className="h-7 w-1 shrink-0 rounded-sm"
                    style={{ backgroundColor: i.profile.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {i.bill.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {i.profile.name}
                    </span>
                  </span>
                  <StatusPill status={i.status} />
                  <span className="font-mono text-sm font-semibold">
                    {formatMoney(i.amount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {canAdd && (
        <Button variant="outline" className="self-start" onClick={onAdd}>
          <Plus aria-hidden /> Dodaj uplatu za taj dan
        </Button>
      )}
    </div>
  );
}

/** This month's unpaid total, paid progress and everything late. */
function MonthTotal({ model, today }: { model: Model; today: Date }) {
  const key = toMonthKey(today);
  const t = totals(model.items.filter((i) => i.dueMonth === key));
  const late = model.items.filter((i) => i.status === "late");
  const leftCount = t.dueCount + t.lateCount;
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return (
    <section
      aria-label="Preostalo za platiti"
      className="flex flex-col gap-2.5 rounded-2xl bg-ink px-5 py-4.5 text-white"
    >
      <p className="text-[13px] text-[#B9BCC4]">
        Preostalo za platiti · {MONTHS_HR[today.getMonth()]}
      </p>
      <p className="font-mono text-[30px] leading-[1.1] font-semibold tracking-tight">
        {formatMoney(t.due + t.late)}
      </p>
      <p className="text-[13px] text-[#B9BCC4]">
        {leftCount
          ? `${leftCount} ${plural(leftCount, "uplata", "uplate", "uplata")} do ${monthEnd.getDate()}.${monthEnd.getMonth() + 1}.`
          : "Sve je plaćeno za ovaj mjesec."}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-[#3A3F47]"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-lime"
          style={{ width: `${t.total ? (t.paid / t.total) * 100 : 0}%` }}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-1.5 text-xs text-[#B9BCC4]">
        <span>
          Plaćeno {t.paidCount} od {t.count} · {formatMoney(t.paid)}
        </span>
        {late.length > 0 && (
          <span className="font-semibold text-[#F8B98A]">
            Kasni {late.length} · {formatMoney(sum(late))}
          </span>
        )}
      </div>
    </section>
  );
}

/** When next month's instances open (same copy as the dashboard). */
function NextMonth({ model, today }: { model: Model; today: Date }) {
  const next = addMonths(today, 1);
  if (!model.activeBills.length) {
    return (
      <section className="flex flex-col items-start gap-1 rounded-2xl bg-lime px-4.5 py-4">
        <p className="text-[15px] font-bold">Dodajte prvi račun</p>
        <p className="text-[13px] text-[#2A2E35]">
          Struja, voda, internet – sve što plaćate svaki mjesec.
        </p>
        <Link
          href="/bills"
          className={cn(buttonVariants({ size: "sm" }), "mt-2")}
        >
          Dodaj račun
        </Link>
      </section>
    );
  }
  const days = Math.round((next.getTime() - today.getTime()) / 86_400_000);
  const count = model.activeBills.length;
  return (
    <section className="flex flex-col gap-1 rounded-2xl bg-lime px-4.5 py-4">
      <p className="text-[15px] font-bold">
        {monthTitle(next).split(" ")[0]} se otvara za {days}{" "}
        {plural(days, "dan", "dana", "dana")}
      </p>
      <p className="text-[13px] leading-normal text-[#2A2E35]">
        1.{next.getMonth() + 1}. u 00:01 otvorit će se {count}{" "}
        {plural(count, "nova uplata", "nove uplate", "novih uplata")} s
        prošlomjesečnim iznosima i datumima dospijeća.
      </p>
    </section>
  );
}
