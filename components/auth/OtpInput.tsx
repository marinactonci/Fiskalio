"use client";

import * as React from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

/** Clerk's e-mail and authenticator-app codes are six digits. */
export const CODE_LENGTH = 6;

type OtpInputProps = Omit<
  React.ComponentProps<typeof InputOTP>,
  "maxLength" | "pattern" | "render" | "children" | "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  /** Marks the slots (and the input, for screen readers) as wrong. */
  invalid?: boolean;
};

// Narrower slots below 360px so the row still fits a dialog on a 320px phone.
const slotClass =
  "h-12 w-10 rounded-xl border border-input bg-white font-mono text-xl font-semibold text-ink shadow-none first:rounded-xl last:rounded-xl max-[359px]:w-9 sm:h-14 sm:w-12 sm:text-[22px]";

const groupClass = "gap-1.5 max-[359px]:gap-1 sm:gap-2";

const invalidSlotClass =
  "border-late-border data-[active=true]:border-late data-[active=true]:ring-late/20";

/**
 * Six separate digit boxes on top of one real input (shadcn's InputOTP), so
 * typing, pasting and the phone's "code from Messages/Mail" suggestion all
 * work. Pair it with `onComplete` to verify as soon as the last digit lands.
 */
export function OtpInput({
  value,
  onChange,
  invalid,
  className,
  containerClassName,
  onPasteCapture,
  ...props
}: OtpInputProps) {
  const slot = cn(slotClass, invalid && invalidSlotClass);
  return (
    <InputOTP
      maxLength={CODE_LENGTH}
      pattern={REGEXP_ONLY_DIGITS}
      // Codes copied out of an e-mail often bring spaces or a line break.
      pasteTransformer={(text) => text.replace(/\D/g, "")}
      // input-otp splices a paste in at the caret. A whole code should replace
      // half-typed digits instead, or the mix would be sent off as a wrong code
      // and burn an attempt – so select everything before its handler runs.
      onPasteCapture={(e) => {
        const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "");
        if (pasted.length === CODE_LENGTH) {
          e.currentTarget.setSelectionRange(0, e.currentTarget.value.length);
        }
        onPasteCapture?.(e);
      }}
      inputMode="numeric"
      autoComplete="one-time-code"
      value={value}
      onChange={onChange}
      aria-invalid={invalid || undefined}
      containerClassName={cn(
        "gap-2.5 max-[359px]:gap-2 sm:gap-3.5",
        containerClassName,
      )}
      className={className}
      {...props}
    >
      <InputOTPGroup className={groupClass}>
        <InputOTPSlot index={0} className={slot} />
        <InputOTPSlot index={1} className={slot} />
        <InputOTPSlot index={2} className={slot} />
      </InputOTPGroup>
      <InputOTPGroup className={groupClass}>
        <InputOTPSlot index={3} className={slot} />
        <InputOTPSlot index={4} className={slot} />
        <InputOTPSlot index={5} className={slot} />
      </InputOTPGroup>
    </InputOTP>
  );
}

/**
 * Runs one code check at a time (the last digit and Enter can't both fire a
 * request) and puts focus back in the code field after a failed check, so the
 * next attempt can be typed straight away. A check that resolves `true` is
 * navigating away: the field then stays locked and the spinner keeps going.
 */
export function useCodeCheck() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inFlight = React.useRef(false);
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    if (!checking) inputRef.current?.focus();
  }, [checking]);

  const run = React.useCallback(
    async (check: () => Promise<boolean | void>) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setChecking(true);
      let leaving = false;
      try {
        leaving = (await check()) === true;
      } finally {
        if (!leaving) {
          inFlight.current = false;
          setChecking(false);
        }
      }
    },
    [],
  );

  return { inputRef, checking, run };
}

/**
 * The line under a code field: explains that there is nothing to click, then
 * turns into a spinner while the code is being checked.
 */
export function CodeStatus({
  id,
  checking,
  className,
}: {
  id?: string;
  checking: boolean;
  className?: string;
}) {
  return (
    <>
      <p
        id={id}
        className={cn(
          "flex min-h-5 items-center gap-2 text-[13px]",
          checking ? "font-semibold text-ink" : "text-muted-foreground",
          className,
        )}
      >
        {checking ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Provjeravam kod…
          </>
        ) : (
          "Kod se provjerava sam čim upišete svih šest znamenki."
        )}
      </p>
      {/* Only the start of a check is announced; a failure has its own
          role="alert" and the static hint shouldn't be read out again. */}
      <span aria-live="polite" className="sr-only">
        {checking ? "Provjeravam kod…" : ""}
      </span>
    </>
  );
}
