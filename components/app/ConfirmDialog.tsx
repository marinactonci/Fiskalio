"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  tone = "destructive",
  secondaryLabel,
  onSecondary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  /** "destructive" for deletes, "default" for reversible actions. */
  tone?: "destructive" | "default";
  /** Optional safer alternative shown next to Cancel, e.g. "Arhiviraj umjesto toga". */
  secondaryLabel?: string;
  onSecondary?: () => void | Promise<void>;
}) {
  const run = (fn: () => void | Promise<void>) => (e: React.MouseEvent) => {
    e.preventDefault();
    void Promise.resolve(fn()).finally(() => onOpenChange(false));
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl bg-card">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-bold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={cn(secondaryLabel && "sm:justify-between")}>
          {secondaryLabel && onSecondary && (
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "ghost" }), "sm:mr-auto")}
              onClick={run(onSecondary)}
            >
              {secondaryLabel}
            </AlertDialogAction>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className={buttonVariants({ variant: "outline" })}>
              Odustani
            </AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: tone === "destructive" ? "destructive" : "default" })}
              onClick={run(onConfirm)}
            >
              {confirmLabel}
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
