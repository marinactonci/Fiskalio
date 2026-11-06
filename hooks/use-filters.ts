"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  EMPTY_FILTERS,
  parseFilters,
  writeFilters,
  type Filters,
} from "@/lib/data";

/**
 * Filters live in the URL (`?status=…&profiles=…&bills=…`) so they survive
 * reloads, can be shared, and carry over between Pregled, Kalendar and
 * Statistika.
 */
export function useFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => parseFilters(new URLSearchParams(params)), [params]);

  const setFilters = useCallback(
    (patch: Partial<Filters> | ((f: Filters) => Partial<Filters>)) => {
      const current = parseFilters(new URLSearchParams(window.location.search));
      const p = typeof patch === "function" ? patch(current) : patch;
      const next = writeFilters(
        new URLSearchParams(window.location.search),
        { ...current, ...p },
      );
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const toggleProfile = useCallback(
    (id: string, billProfile: (billId: string) => string | undefined) =>
      setFilters((f) => {
        const on = f.profiles.includes(id);
        const profiles = on
          ? f.profiles.filter((x) => x !== id)
          : [...f.profiles, id];
        // Drop selected bills that no longer belong to a selected profile.
        const bills = profiles.length
          ? f.bills.filter((b) => {
              const pid = billProfile(b);
              return pid ? profiles.includes(pid) : false;
            })
          : f.bills;
        return { profiles, bills };
      }),
    [setFilters],
  );

  const toggleBill = useCallback(
    (id: string) =>
      setFilters((f) => ({
        bills: f.bills.includes(id)
          ? f.bills.filter((x) => x !== id)
          : [...f.bills, id],
      })),
    [setFilters],
  );

  const clear = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);

  return { filters, setFilters, toggleProfile, toggleBill, clear };
}

/** Pages whose content follows the shared filters. */
export const FILTERABLE_PATHS = ["/dashboard", "/calendar", "/stats"];
