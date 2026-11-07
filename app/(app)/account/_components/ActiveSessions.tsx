"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@clerk/nextjs";
import { useReverification } from "./Reverification";
import { formatDistanceToNow } from "date-fns";
import { hr } from "date-fns/locale";
import { Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Spinner,
  btn,
  reportError,
  type ClerkUser,
  type UserSession,
} from "./shared";
import { cn } from "@/lib/utils";

function deviceTitle(session: UserSession) {
  const a = session.latestActivity;
  const device = a?.deviceType || (a?.isMobile ? "Mobitel" : "Računalo");
  const browser = [a?.browserName, a?.browserVersion?.split(".")[0]]
    .filter(Boolean)
    .join(" ");
  return browser ? `${device} · ${browser}` : device;
}

function deviceMeta(session: UserSession, isCurrent: boolean) {
  const a = session.latestActivity;
  const place = [a?.city, a?.country].filter(Boolean).join(", ");
  const when = isCurrent
    ? "sada"
    : formatDistanceToNow(session.lastActiveAt, {
        addSuffix: true,
        locale: hr,
      });
  return [place, when].filter(Boolean).join(" · ");
}

export function ActiveSessions({ user }: { user: ClerkUser }) {
  const { session: currentSession } = useSession();
  const currentId = currentSession?.id;
  const revoke = useReverification((s: UserSession) => s.revoke());

  const [sessions, setSessions] = useState<UserSession[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // getSessions() refreshes the Clerk client, which hands out a new `user`
  // object; keying the effect on the id avoids a fetch loop.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  });
  const userId = user.id;
  useEffect(() => {
    let active = true;
    userRef.current
      .getSessions()
      .then((list) => active && setSessions(list))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [userId]);

  async function onRevoke(session: UserSession) {
    setRevoking(session.id);
    try {
      await revoke(session);
      setSessions((list) => list?.filter((s) => s.id !== session.id) ?? null);
      toast.success("Uređaj je odjavljen.");
    } catch (err) {
      reportError(err);
    } finally {
      setRevoking(null);
    }
  }

  const sorted = [...(sessions ?? [])].sort((a, b) => {
    if (a.id === currentId) return -1;
    if (b.id === currentId) return 1;
    return b.lastActiveAt.getTime() - a.lastActiveAt.getTime();
  });

  return (
    <div className="mt-5">
      <h3 className="mb-2 text-sm font-bold text-ink">Aktivni uređaji</h3>
      {failed ? (
        <p className="rounded-xl border border-line px-3.5 py-3 text-sm text-muted-foreground">
          Popis uređaja trenutačno nije dostupan.
        </p>
      ) : sessions === null ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-line px-3.5 py-3 text-sm text-muted-foreground"
        >
          <Spinner />
          Učitavanje uređaja…
        </p>
      ) : (
        <ul className="rounded-xl border border-line">
          {sorted.map((session) => {
            const isCurrent = session.id === currentId;
            const Icon = session.latestActivity?.isMobile
              ? Smartphone
              : Monitor;
            return (
              <li
                key={session.id}
                className="flex flex-wrap items-center gap-3 border-b border-line-soft px-3.5 py-3 last:border-b-0"
              >
                <Icon
                  className="size-5 shrink-0 text-ink"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-[1_1_180px]">
                  <p className="font-semibold text-ink">
                    {deviceTitle(session)}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {deviceMeta(session, isCurrent)}
                  </p>
                </div>
                {isCurrent ? (
                  <Badge tone="lime">OVAJ UREĐAJ</Badge>
                ) : (
                  <button
                    type="button"
                    className={cn(btn.outline, "h-9 text-[13px]")}
                    onClick={() => onRevoke(session)}
                    disabled={revoking !== null}
                    aria-label={`Odjavi uređaj ${deviceTitle(session)}`}
                  >
                    {revoking === session.id ? <Spinner /> : null}
                    Odjavi
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
