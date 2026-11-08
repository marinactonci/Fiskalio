"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { EmailAddresses } from "./EmailAddresses";
import {
  Field,
  SettingsCard,
  Spinner,
  TextInput,
  btn,
  reportError,
  type ClerkUser,
} from "./shared";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function userInitials(user: ClerkUser) {
  const fromName = `${user.firstName?.trim()[0] ?? ""}${user.lastName?.trim()[0] ?? ""}`;
  const fallback = user.primaryEmailAddress?.emailAddress[0] ?? "?";
  return (fromName || fallback).toUpperCase();
}

export function ProfileSection({ user }: { user: ClerkUser }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageBusy, setImageBusy] = useState<"upload" | "remove" | null>(null);
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [saving, setSaving] = useState(false);

  const dirty =
    firstName.trim() !== (user.firstName ?? "") ||
    lastName.trim() !== (user.lastName ?? "");

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Odaberite sliku (PNG, JPG, GIF ili WEBP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Slika smije imati najviše 10 MB.");
      return;
    }
    setImageBusy("upload");
    try {
      await user.setProfileImage({ file });
      await user.reload();
      toast.success("Fotografija je spremljena.");
    } catch (err) {
      reportError(err);
    } finally {
      setImageBusy(null);
    }
  }

  async function removeImage() {
    setImageBusy("remove");
    try {
      await user.setProfileImage({ file: null });
      await user.reload();
      toast.success("Fotografija je uklonjena.");
    } catch (err) {
      reportError(err);
    } finally {
      setImageBusy(null);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const next = { firstName: firstName.trim(), lastName: lastName.trim() };
    setSaving(true);
    try {
      await user.update(next);
      setFirstName(next.firstName);
      setLastName(next.lastName);
      toast.success("Promjene su spremljene.");
    } catch (err) {
      reportError(err);
    } finally {
      setSaving(false);
    }
  }

  function onReset() {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }

  return (
    <SettingsCard id="osobno" title="Osobni podaci">
      <div className="mt-4.5 flex flex-wrap items-center gap-4">
        {user.hasImage ? (
          // Clerk's image CDN isn't configured for next/image; a plain img is fine here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt="Profilna fotografija"
            className="size-18 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-18 place-items-center rounded-full bg-lime font-display text-[26px] font-extrabold text-ink"
          >
            {userInitials(user)}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={onFile}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            className={btn.outline}
            onClick={() => fileInput.current?.click()}
            disabled={imageBusy !== null}
          >
            {imageBusy === "upload" ? <Spinner /> : null}
            {user.hasImage ? "Promijeni fotografiju" : "Učitaj fotografiju"}
          </button>
          {user.hasImage ? (
            <button
              type="button"
              className={btn.ghost}
              onClick={removeImage}
              disabled={imageBusy !== null}
            >
              {imageBusy === "remove" ? <Spinner /> : null}
              Ukloni
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSave}>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field id="first-name" label="Ime">
            <TextInput
              id="first-name"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </Field>
          <Field id="last-name" label="Prezime">
            <TextInput
              id="last-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className={btn.ghost}
            onClick={onReset}
            disabled={!dirty || saving}
          >
            Odustani
          </button>
          <button
            type="submit"
            className={btn.primary}
            disabled={!dirty || saving}
          >
            {saving ? <Spinner /> : null}
            Spremi promjene
          </button>
        </div>
      </form>

      <EmailAddresses user={user} />
    </SettingsCard>
  );
}
