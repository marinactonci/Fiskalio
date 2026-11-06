"use client";

import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { hr } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import { MonthPicker } from "@/components/ui/monthpicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MONTHS_HR_SHORT,
  WEEKDAYS_HR_SHORT,
  fullDate,
  monthTitle,
  parseISODate,
  parseMonthKey,
  toISODate,
  toMonthKey,
  weekdayIndex,
} from "@/lib/format";
import { cn } from "@/lib/utils";

/** Looks like our `Input`, opens a popover. */
const triggerClass =
  "flex h-11 w-full items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 text-left text-sm text-ink outline-none transition-[color,box-shadow] hover:border-ink/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[invalid=true]:border-late data-[invalid=true]:ring-late/20 data-[state=open]:border-ring";

const popoverClass = "w-auto rounded-2xl p-0 shadow-lg";

/** "sub, 14.11.2026." (short enough for a half-width column) */
function dueLabel(d: Date) {
  return `${WEEKDAYS_HR_SHORT[weekdayIndex(d)]}, ${fullDate(d)}`;
}

/** Single date as "yyyy-MM-dd", picked from the shadcn calendar. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Odaberite datum",
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISODate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={triggerClass}
          data-invalid={invalid || undefined}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? dueLabel(selected) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className={popoverClass} align="start">
        <Calendar
          mode="single"
          locale={hr}
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected}
          autoFocus
          onSelect={(d) => {
            if (!d) return;
            onChange(toISODate(d));
            setOpen(false);
          }}
          className="p-3 [--cell-size:--spacing(9)]"
          classNames={{
            caption_label: "select-none text-sm font-semibold capitalize",
            weekday:
              "flex-1 select-none text-[0.75rem] font-medium uppercase text-muted-foreground",
            today:
              "rounded-md bg-lime-soft text-ink data-[selected=true]:rounded-none",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** Month as "yyyy-MM", picked from a 4×3 month grid. */
export function MonthField({
  id,
  value,
  onChange,
  placeholder = "Odaberite mjesec",
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseMonthKey(value) ?? undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={triggerClass}
          data-invalid={invalid || undefined}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? monthTitle(selected) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className={popoverClass} align="start">
        <MonthPicker
          selectedMonth={selected}
          onMonthSelect={(d) => {
            onChange(toMonthKey(d));
            setOpen(false);
          }}
          callbacks={{
            monthLabel: (m) => {
              const s = MONTHS_HR_SHORT[m.number];
              return s[0].toUpperCase() + s.slice(1);
            },
          }}
          variant={{ chevrons: "ghost" }}
        />
      </PopoverContent>
    </Popover>
  );
}
