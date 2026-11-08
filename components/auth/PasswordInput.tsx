"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Password field with a show/hide toggle that keeps a 44px hit area. */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(className, "pr-12")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sakrij lozinku" : "Prikaži lozinku"}
        aria-pressed={visible}
        className="absolute top-1/2 right-0.5 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted-foreground outline-none hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {visible ? (
          <EyeOff className="size-4.5" aria-hidden="true" />
        ) : (
          <Eye className="size-4.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
