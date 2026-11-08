"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import {
  BarChart3,
  CalendarDays,
  Filter,
  Home,
  Plus,
  Receipt,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { useAppActions } from "@/components/app/AppActions";
import { api } from "@/convex/_generated/api";
import { FILTERABLE_PATHS } from "@/hooks/use-filters";
import { useModel } from "@/hooks/use-model";
import { parseFilters, writeFilters } from "@/lib/data";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Pregled", icon: Home },
  { href: "/calendar", label: "Kalendar", icon: CalendarDays },
  { href: "/bills", label: "Računi", icon: Receipt },
  { href: "/stats", label: "Statistika", icon: BarChart3 },
];

function useOpenCount() {
  const state = useModel();
  return useMemo(() => {
    if (state.status !== "ready") return null;
    const { items, today } = state.model;
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return items.filter((i) => i.status !== "paid" && i.due <= end).length;
  }, [state]);
}

function UserChip({ compact = false }: { compact?: boolean }) {
  const { user } = useUser();
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    "?";
  const avatar = user?.hasImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.imageUrl} alt="" className="size-8.5 rounded-full object-cover" />
  ) : (
    <span className="grid size-8.5 place-items-center rounded-full bg-lime text-[13px] font-bold">
      {initials}
    </span>
  );
  if (compact) return avatar;
  return (
    <>
      {avatar}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-semibold">
          {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Moj račun"}
        </span>
        <span className="text-xs text-muted-foreground">Postavke računa</span>
      </span>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const state = useModel();
  const views = useQuery(api.savedViews.list);
  const removeView = useMutation(api.savedViews.remove);
  const { openPalette, openProfile } = useAppActions();
  const openCount = useOpenCount();

  const onFilterable = FILTERABLE_PATHS.includes(pathname);
  const filters = parseFilters(new URLSearchParams(params));
  const model = state.status === "ready" ? state.model : null;

  const toggleProfile = (id: string) => {
    if (!onFilterable) {
      router.push(`/calendar?profiles=${id}`);
      return;
    }
    const on = filters.profiles.includes(id);
    const profiles = on ? filters.profiles.filter((p) => p !== id) : [...filters.profiles, id];
    const bills = profiles.length
      ? filters.bills.filter((b) => {
          const pid = model?.billById.get(b)?.profileId;
          return pid ? profiles.includes(pid) : false;
        })
      : filters.bills;
    const qs = writeFilters(new URLSearchParams(params), { ...filters, profiles, bills }).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const applyView = (query: string) => {
    const target = onFilterable ? pathname : "/calendar";
    router.push(`${target}?${query}`);
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-62 shrink-0 flex-col gap-6 overflow-y-auto border-r border-line px-3.5 py-5 lg:flex">
      <Logo href="/dashboard" className="px-2" />

      <button
        type="button"
        onClick={openPalette}
        className="flex h-10 items-center gap-2.5 rounded-xl border border-input bg-card px-3 text-sm text-muted-foreground hover:border-ink-2"
      >
        <Search className="size-4" aria-hidden />
        Traži ili skoči
        <kbd className="ml-auto rounded-md bg-line-soft px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
          Ctrl K
        </kbd>
      </button>

      <nav aria-label="Aplikacija" className="flex flex-col gap-0.5 font-medium">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm",
                active ? "bg-ink text-white" : "hover:bg-secondary",
              )}
            >
              <Icon className="size-4.25" aria-hidden />
              {label}
              {href === "/dashboard" && openCount ? (
                <span className="ml-auto rounded-full bg-lime px-2 font-mono text-xs text-ink">
                  {openCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div>
        <div className="flex items-center justify-between px-2.5 pb-1.5">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Profili
          </span>
          <button
            type="button"
            onClick={() => openProfile()}
            aria-label="Novi profil"
            className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-ink"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-0.5">
          {model?.profiles.map((p) => {
            const active = onFilterable && filters.profiles.includes(p._id);
            const open = model.items.filter(
              (i) => i.profile._id === p._id && i.status !== "paid",
            ).length;
            return (
              <button
                key={p._id}
                type="button"
                onClick={() => toggleProfile(p._id)}
                aria-pressed={onFilterable ? active : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm",
                  active ? "bg-secondary font-semibold" : "hover:bg-secondary",
                )}
              >
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: p.color }} aria-hidden />
                <span className="truncate">{p.name}</span>
                {open > 0 && (
                  <span className="ml-auto font-mono text-xs text-muted-foreground">{open}</span>
                )}
              </button>
            );
          })}
          {model && model.profiles.length === 0 && (
            <button
              type="button"
              onClick={() => openProfile()}
              className="rounded-xl border border-dashed border-input px-2.5 py-2 text-left text-sm text-ink-2 hover:bg-secondary"
            >
              + Dodaj prvi profil
            </button>
          )}
        </div>
      </div>

      {views?.success && views.data.length > 0 && (
        <div>
          <div className="px-2.5 pb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Spremljeni pogledi
          </div>
          <div className="flex flex-col gap-0.5">
            {views.data.map((v) => (
              <div key={v._id} className="group flex items-center rounded-xl hover:bg-secondary">
                <button
                  type="button"
                  onClick={() => applyView(v.query)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left text-sm"
                >
                  <Filter className="size-3.75 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{v.name}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Obriši pogled ${v.name}`}
                  onClick={async () => {
                    const res = await removeView({ id: v._id });
                    if (res.success) toast.success("Pogled je obrisan.");
                  }}
                  className="mr-1 grid size-7 place-items-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-ink focus-visible:opacity-100"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/account"
        className={cn(
          "mt-auto flex items-center gap-2.5 rounded-xl p-2 text-sm",
          pathname === "/account" ? "bg-secondary" : "hover:bg-secondary",
        )}
      >
        <UserChip />
      </Link>
    </aside>
  );
}

export function MobileHeader() {
  const { openPalette } = useAppActions();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-2 backdrop-blur lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2" aria-label="Fiskalio – pregled">
        <LogoMark className="size-7" />
        <span className="font-display text-lg font-extrabold tracking-tight">fiskalio</span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={openPalette}
          aria-label="Traži"
          className="grid size-11 place-items-center rounded-xl hover:bg-secondary"
        >
          <Search className="size-5" aria-hidden />
        </button>
        <Link href="/account" aria-label="Postavke računa" className="grid size-11 place-items-center">
          <UserChip compact />
        </Link>
      </div>
    </header>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { openInstance } = useAppActions();
  const tabs = NAV.slice(0, 2);
  const tabs2 = NAV.slice(2);
  const Tab = ({ href, label, icon: Icon }: (typeof NAV)[number]) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 text-[11px] font-semibold",
          active ? "text-ink" : "text-muted-foreground",
        )}
      >
        <Icon className="size-5.5" strokeWidth={active ? 2.3 : 2} aria-hidden />
        {label}
      </Link>
    );
  };
  return (
    <nav
      aria-label="Aplikacija"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-center border-t border-line bg-card px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden"
    >
      {tabs.map((t) => (
        <Tab key={t.href} {...t} />
      ))}
      <span className="grid place-items-center">
        <button
          type="button"
          onClick={() => openInstance()}
          aria-label="Nova uplata"
          className="-mt-7 grid size-13 place-items-center rounded-2xl bg-ink text-lime shadow-[0_8px_18px_rgba(21,23,28,0.25)]"
        >
          <Plus className="size-5.5" strokeWidth={2.6} aria-hidden />
        </button>
      </span>
      {tabs2.map((t) => (
        <Tab key={t.href} {...t} />
      ))}
    </nav>
  );
}
