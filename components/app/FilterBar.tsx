"use client";

import { useMutation } from "convex/react";
import { Bookmark, Check, ChevronDown, Receipt, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { useFilters } from "@/hooks/use-filters";
import {
  filtersToQuery,
  hasActiveFilters,
  inScope,
  matchesStatus,
  type Model,
  type StatusFilter,
} from "@/lib/data";
import { formatAmount, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Field } from "@/components/app/form";

const STATUS_OPTS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Sve" },
  { key: "unpaid", label: "Neplaćeno" },
  { key: "late", label: "Kasni" },
  { key: "paid", label: "Plaćeno" },
];

/**
 * The one filter model of the app: status × profiles × individual bills.
 * Counts on the status buttons follow the current profile/bill scope and the
 * items passed in (e.g. the visible month).
 */
export function FilterBar({
  model,
  scopeItems,
  showStatus = true,
  summary,
}: {
  model: Model;
  /** Items the status counts are computed from (already limited to the period on screen). */
  scopeItems: Model["items"];
  showStatus?: boolean;
  summary?: React.ReactNode;
}) {
  const { filters, setFilters, toggleProfile, toggleBill, clear } = useFilters();
  const [billsOpen, setBillsOpen] = useState(false);
  const [billQuery, setBillQuery] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  const counts = useMemo(() => {
    const scoped = scopeItems.filter((i) => inScope(i, filters));
    return Object.fromEntries(
      STATUS_OPTS.map((o) => [o.key, scoped.filter((i) => matchesStatus(i, o.key)).length]),
    ) as Record<StatusFilter, number>;
  }, [scopeItems, filters]);

  const billProfile = (id: string) => model.billById.get(id)?.profileId;

  const visibleProfiles = model.profiles.filter(
    (p) => filters.profiles.length === 0 || filters.profiles.includes(p._id),
  );
  const q = billQuery.trim().toLowerCase();
  const lastAmount = (billId: string) => {
    const h = model.items.filter((i) => i.bill._id === billId);
    return h.length ? h[h.length - 1].amount : undefined;
  };

  const nb = filters.bills.length;
  const billsLabel = nb === 0 ? "Svi računi" : `${nb} ${plural(nb, "račun", "računa", "računa")}`;
  const active = hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {showStatus && (
          <>
            <div role="group" aria-label="Status" className="flex flex-wrap rounded-xl bg-paper p-1">
              {STATUS_OPTS.map((o) => {
                const on = filters.status === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilters({ status: o.key })}
                    className={cn(
                      "flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold",
                      on ? "bg-ink text-white" : "text-ink-2 hover:bg-secondary",
                    )}
                  >
                    {o.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 font-mono text-[11px] text-ink",
                        on ? "bg-lime" : "bg-secondary",
                      )}
                    >
                      {counts[o.key]}
                    </span>
                  </button>
                );
              })}
            </div>
            <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
          </>
        )}

        <div role="group" aria-label="Profili" className="flex flex-wrap gap-1.5">
          {model.profiles.map((p) => {
            const on = filters.profiles.includes(p._id);
            return (
              <button
                key={p._id}
                type="button"
                aria-pressed={on}
                onClick={() => toggleProfile(p._id, billProfile)}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[13px] font-semibold",
                  on ? "border-ink bg-lime-soft" : "border-input bg-card hover:border-ink-2",
                )}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                {p.name}
                {on && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
              </button>
            );
          })}
        </div>

        <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />

        <Popover open={billsOpen} onOpenChange={setBillsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-9 items-center gap-2 rounded-xl border-[1.5px] px-3 text-[13px] font-semibold",
                nb ? "border-ink bg-lime-soft" : "border-input bg-card hover:border-ink-2",
              )}
            >
              <Receipt className="size-3.5" aria-hidden />
              {billsLabel}
              <ChevronDown className="size-3.5" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(340px,calc(100vw-2rem))] rounded-2xl p-2.5">
            <label className="flex h-10 items-center gap-2 rounded-xl bg-paper px-3 text-muted-foreground">
              <Search className="size-4" aria-hidden />
              <span className="sr-only">Traži račun</span>
              <input
                value={billQuery}
                onChange={(e) => setBillQuery(e.target.value)}
                placeholder="Traži račun…"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none"
              />
            </label>
            <p className="mx-1 mt-2 mb-1 text-xs text-muted-foreground">
              Ništa označeno = svi računi odabranih profila
            </p>
            <div className="max-h-72 overflow-y-auto">
              {visibleProfiles.map((p) => {
                const bills = model.bills.filter(
                  (b) => b.profileId === p._id && (!q || b.name.toLowerCase().includes(q)),
                );
                if (!bills.length) return null;
                return (
                  <div key={p._id} className="py-1">
                    <div className="flex items-center gap-2 px-1.5 py-1 text-xs font-bold text-ink-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                      {p.name}
                    </div>
                    {bills.map((b) => {
                      const amt = lastAmount(b._id);
                      return (
                        <label
                          key={b._id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-2 text-[13px] hover:bg-paper"
                        >
                          <Checkbox
                            checked={filters.bills.includes(b._id)}
                            onCheckedChange={() => toggleBill(b._id)}
                          />
                          {b.name}
                          {b.archivedAt && <span className="text-xs text-muted-foreground">arhiviran</span>}
                          {amt !== undefined && (
                            <span className="ml-auto font-mono text-xs text-muted-foreground">
                              {formatAmount(amt)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                );
              })}
              {model.bills.length === 0 && (
                <p className="px-2 py-3 text-sm text-muted-foreground">Još nema računa.</p>
              )}
            </div>
            <div className="mt-1 flex justify-between gap-2 border-t border-line-soft pt-2">
              <Button variant="ghost" size="sm" onClick={() => setFilters({ bills: [] })}>
                Poništi račune
              </Button>
              <Button size="sm" onClick={() => setBillsOpen(false)}>
                Gotovo
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex items-center gap-1.5">
          {active && (
            <Button variant="ghost" size="sm" onClick={clear}>
              Očisti filtre
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)} disabled={!active}>
            <Bookmark aria-hidden />
            Spremi pogled
          </Button>
        </div>
      </div>
      {summary && <p className="mx-1 text-[13px] text-muted-foreground">{summary}</p>}

      {saveOpen && (
        <SaveViewDialog
          open={saveOpen}
          onOpenChange={setSaveOpen}
          query={filtersToQuery(filters)}
        />
      )}
    </div>
  );
}

function SaveViewDialog({
  open,
  onOpenChange,
  query,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  query: string;
}) {
  const create = useMutation(api.savedViews.create);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Upišite naziv pogleda.");
      return;
    }
    const res = await create({ name, query });
    if (res.success) {
      toast.success("Pogled je spremljen u bočnu traku.");
      onOpenChange(false);
    } else toast.error(res.error || "Spremanje nije uspjelo.");
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Spremi pogled</DialogTitle>
          <DialogDescription>Trenutni filtri pojavit će se u bočnoj traci.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Naziv" htmlFor="view-name" error={error}>
            <Input
              id="view-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="npr. Režije stana"
              autoFocus
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Odustani
            </Button>
            <Button type="submit">Spremi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
