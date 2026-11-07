"use client";

import {
  BarChart3,
  CalendarDays,
  FilePlus2,
  FolderPlus,
  Home,
  PlusCircle,
  Receipt,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppActions } from "@/components/app/AppActions";
import { useModel } from "@/hooks/use-model";

/** Ctrl/⌘+K: jump straight to any bill or profile, or start an action. */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, openInstance, openBill, openProfile } =
    useAppActions();
  const router = useRouter();
  const state = useModel();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  const run = (fn: () => void) => {
    setPaletteOpen(false);
    fn();
  };

  const model = state.status === "ready" ? state.model : null;

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      title="Traži ili skoči"
      description="Potražite račun, profil ili radnju"
    >
      <CommandInput placeholder="Traži račun, profil ili radnju…" />
      <CommandList>
        <CommandEmpty>Ništa nije pronađeno.</CommandEmpty>
        {model && model.bills.length > 0 && (
          <CommandGroup heading="Računi">
            {model.bills.map((b) => {
              const p = model.profileById.get(b.profileId);
              return (
                <CommandItem
                  key={b._id}
                  value={`${b.name} ${p?.name ?? ""} ${b._id}`}
                  onSelect={() => run(() => router.push(`/bills?bill=${b._id}`))}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: p?.color }}
                    aria-hidden
                  />
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted-foreground">{p?.name}</span>
                  {b.archivedAt && <span className="ml-auto text-xs text-muted-foreground">arhiviran</span>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {model && model.profiles.length > 0 && (
          <CommandGroup heading="Profili – prikaži u kalendaru">
            {model.profiles.map((p) => (
              <CommandItem
                key={p._id}
                value={`profil ${p.name} ${p._id}`}
                onSelect={() => run(() => router.push(`/calendar?profiles=${p._id}`))}
              >
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: p.color }} aria-hidden />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandSeparator />
        <CommandGroup heading="Radnje">
          <CommandItem value="nova uplata" onSelect={() => run(() => openInstance())}>
            <PlusCircle /> Nova uplata
          </CommandItem>
          <CommandItem value="novi račun" onSelect={() => run(() => openBill())}>
            <FilePlus2 /> Novi račun
          </CommandItem>
          <CommandItem value="novi profil" onSelect={() => run(() => openProfile())}>
            <FolderPlus /> Novi profil
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Idi na">
          <CommandItem value="pregled" onSelect={() => run(() => router.push("/dashboard"))}>
            <Home /> Pregled
          </CommandItem>
          <CommandItem value="kalendar" onSelect={() => run(() => router.push("/calendar"))}>
            <CalendarDays /> Kalendar
          </CommandItem>
          <CommandItem value="računi" onSelect={() => run(() => router.push("/bills"))}>
            <Receipt /> Računi
          </CommandItem>
          <CommandItem value="statistika" onSelect={() => run(() => router.push("/stats"))}>
            <BarChart3 /> Statistika
          </CommandItem>
          <CommandItem value="postavke računa" onSelect={() => run(() => router.push("/account"))}>
            <UserRound /> Postavke računa
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
