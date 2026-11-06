"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { useModel } from "@/hooks/use-model";
import type { Item } from "@/lib/data";
import { InstanceDialog } from "@/components/app/dialogs/InstanceDialog";
import { BillDialog } from "@/components/app/dialogs/BillDialog";
import { ProfileDialog } from "@/components/app/dialogs/ProfileDialog";

type DialogState =
  | { kind: "none" }
  | { kind: "instance"; item?: Item; billId?: string; dueDate?: string }
  | { kind: "bill"; billId?: string; profileId?: string }
  | { kind: "profile"; profileId?: string };

interface Actions {
  openInstance: (opts?: { item?: Item; billId?: string; dueDate?: string }) => void;
  openBill: (opts?: { billId?: string; profileId?: string }) => void;
  openProfile: (opts?: { profileId?: string }) => void;
  openPalette: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const ActionsContext = createContext<Actions | null>(null);

export function useAppActions(): Actions {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useAppActions must be used inside <AppActionsProvider>");
  return ctx;
}

/**
 * Holds the create/edit dialogs for the whole app so any view (calendar cell,
 * list row, drawer, command palette, mobile "+" button) can open them.
 */
export function AppActionsProvider({ children }: { children: React.ReactNode }) {
  const state = useModel();
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [nonce, setNonce] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const open = useCallback((d: DialogState) => {
    setNonce((n) => n + 1);
    setDialog(d);
  }, []);
  const close = useCallback((o: boolean) => {
    if (!o) setDialog({ kind: "none" });
  }, []);

  const actions = useMemo<Actions>(
    () => ({
      openInstance: (o) => open({ kind: "instance", ...o }),
      openBill: (o) => open({ kind: "bill", ...o }),
      openProfile: (o) => open({ kind: "profile", ...o }),
      openPalette: () => setPaletteOpen(true),
      paletteOpen,
      setPaletteOpen,
    }),
    [open, paletteOpen],
  );

  const model = state.status === "ready" ? state.model : null;

  return (
    <ActionsContext.Provider value={actions}>
      {children}
      {model && dialog.kind === "instance" && (
        <InstanceDialog
          key={nonce}
          open
          onOpenChange={close}
          model={model}
          item={dialog.item}
          billId={dialog.billId}
          dueDate={dialog.dueDate}
        />
      )}
      {model && dialog.kind === "bill" && (
        <BillDialog
          key={nonce}
          open
          onOpenChange={close}
          model={model}
          billId={dialog.billId}
          profileId={dialog.profileId}
          onCreated={(id) => {
            router.push(`/bills?bill=${id}`);
            toast("Dodati prvu uplatu za ovaj račun?", {
              action: {
                label: "Dodaj uplatu",
                onClick: () => open({ kind: "instance", billId: id }),
              },
            });
          }}
          onDeleted={() => router.replace("/bills")}
        />
      )}
      {model && dialog.kind === "profile" && (
        <ProfileDialog
          key={nonce}
          open
          onOpenChange={close}
          model={model}
          profileId={dialog.profileId}
          onCreated={(id) =>
            toast("Profil je spreman. Dodajte mu prvi račun.", {
              action: {
                label: "Novi račun",
                onClick: () => open({ kind: "bill", profileId: id }),
              },
            })
          }
        />
      )}
    </ActionsContext.Provider>
  );
}
