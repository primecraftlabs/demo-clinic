"use client";

import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import { DAY_NAMES, dateKey, formatDate, type Doctor } from "@/lib/booking";
import {
  cleanLeave,
  doctorLimits,
  initialsOf,
  parseLanguages,
  validateProfile,
  validateSchedule,
  type ProfileErrors,
  type ScheduleErrors,
} from "@/lib/doctors";
import { avatarSettings } from "@/config/avatars";
import type { DoctorFields } from "@/services";
import { useNow } from "./hooks";
import { Icon } from "./Icons";
import { avatarChoices, avatarDataUri } from "./avatar";
import { DoctorAvatar } from "./ui";

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 aria-invalid:border-danger";

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

/**
 * Edit a doctor's profile, avatar and leave days. With `canEditSchedule` (admin) also the working days, hours,
 * appointment length and whether the profile is published.
 */
export function ProfileEditor({
  doctor,
  onSave,
  canEditSchedule,
}: {
  doctor: Doctor;
  onSave: (patch: Partial<DoctorFields>) => Promise<void>;
  canEditSchedule: boolean;
}) {
  const now = useNow();
  const today = now ? dateKey(now) : "";
  const [name, setName] = useState(doctor.name);
  const [speciality, setSpeciality] = useState(doctor.speciality);
  const [experience, setExperience] = useState(String(doctor.experience));
  const [languages, setLanguages] = useState(doctor.languages.join(", "));
  const [about, setAbout] = useState(doctor.about);
  const [leave, setLeave] = useState(doctor.leave);
  const [newLeave, setNewLeave] = useState("");
  const [days, setDays] = useState(doctor.days);
  const [start, setStart] = useState(doctor.start);
  const [end, setEnd] = useState(doctor.end);
  const [slotMinutes, setSlotMinutes] = useState(doctor.slotMinutes);
  const [active, setActive] = useState(doctor.active);
  const [avatar, setAvatar] = useState(doctor.avatar);
  const [avatarPage, setAvatarPage] = useState(0);
  const [picking, setPicking] = useState(false);
  const [errors, setErrors] = useState<ProfileErrors & ScheduleErrors>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  function addLeave() {
    if (!newLeave) return;
    setLeave(cleanLeave([...leave, newLeave], today));
    setNewLeave("");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const profile = {
      name: name.trim(),
      initials: initialsOf(name),
      speciality: speciality.trim(),
      about: about.trim(),
      experience: Number(experience),
      languages: parseLanguages(languages),
      leave: cleanLeave(leave, today),
      avatar,
    };
    const schedule = { days: [...days].sort(), start, end, slotMinutes };
    const found = { ...validateProfile(profile), ...(canEditSchedule ? validateSchedule(schedule) : {}) };
    setErrors(found);
    if (Object.keys(found).length > 0) return setStatus("");
    setBusy(true);
    try {
      await onSave(canEditSchedule ? { ...profile, ...schedule, active } : profile);
      setStatus("Saved.");
    } catch {
      setStatus("Couldn't save. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h3 className="text-lg font-bold">Profile</h3>
        <div className="flex flex-wrap items-center gap-4">
          <DoctorAvatar doctor={{ ...doctor, name, initials: initialsOf(name), avatar }} size="size-20 text-xl" />
          <button
            type="button"
            onClick={() => setPicking(!picking)}
            aria-expanded={picking}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-bg-alt"
          >
            {picking ? "Done choosing" : "Choose avatar"}
          </button>
          {avatar && (
            <button type="button" onClick={() => setAvatar("")} className="text-sm font-semibold text-muted hover:text-fg hover:underline">
              Use initials instead
            </button>
          )}
        </div>
        {picking && (
          <div className="rounded-2xl bg-bg-alt p-4">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6" role="radiogroup" aria-label="Avatars">
              {avatarChoices(doctor.id, avatarPage, avatarSettings.choicesPerPage).map((seed, i) => (
                <button
                  key={seed}
                  type="button"
                  role="radio"
                  aria-checked={avatar === seed}
                  aria-label={`Avatar ${i + 1}`}
                  onClick={() => setAvatar(seed)}
                  className={`relative aspect-square overflow-hidden rounded-full bg-surface ring-offset-2 transition hover:ring-2 hover:ring-brand/50 ${avatar === seed ? "ring-3 ring-brand" : ""}`}
                >
                  <Image src={avatarDataUri(seed)} alt="" fill unoptimized sizes="80px" />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setAvatarPage(avatarPage + 1)} className="mt-4 text-sm font-semibold text-brand hover:underline">
              Show more avatars
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="p-name" label="Name (as patients see it)" error={errors.name}>
            <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={doctorLimits.nameMax} aria-invalid={!!errors.name} className={input} />
          </Field>
          <Field id="p-spec" label="Speciality" error={errors.speciality}>
            <input id="p-spec" value={speciality} onChange={(e) => setSpeciality(e.target.value)} maxLength={doctorLimits.specialityMax} aria-invalid={!!errors.speciality} className={input} />
          </Field>
          <Field id="p-exp" label="Years of experience" error={errors.experience}>
            <input id="p-exp" type="number" inputMode="numeric" min={0} max={doctorLimits.experienceMax} value={experience} onChange={(e) => setExperience(e.target.value)} aria-invalid={!!errors.experience} className={input} />
          </Field>
          <Field id="p-lang" label="Languages" hint="Separate with commas, e.g. Hindi, English" error={errors.languages}>
            <input id="p-lang" value={languages} onChange={(e) => setLanguages(e.target.value)} aria-invalid={!!errors.languages} className={input} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="p-about" label="About" hint={`What you help patients with (up to ${doctorLimits.aboutMax} characters)`} error={errors.about}>
              <textarea id="p-about" rows={3} value={about} maxLength={doctorLimits.aboutMax} onChange={(e) => setAbout(e.target.value)} aria-invalid={!!errors.about} className={input} />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h3 className="text-lg font-bold">Leave days</h3>
        <p className="text-sm text-muted">Patients can&apos;t book these dates. Past dates are removed automatically.</p>
        <div className="flex flex-wrap items-end gap-3">
          <Field id="p-leave" label="Add a date">
            <input id="p-leave" type="date" min={today} value={newLeave} onChange={(e) => setNewLeave(e.target.value)} className={input} />
          </Field>
          <button type="button" onClick={addLeave} disabled={!newLeave} className="rounded-xl border border-line px-4 py-3 font-semibold hover:bg-bg-alt disabled:opacity-50">
            Add
          </button>
        </div>
        {errors.leave && <p className="text-sm font-medium text-danger">{errors.leave}</p>}
        {leave.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {leave.map((d) => (
              <li key={d} className="flex items-center gap-1 rounded-full bg-bg-alt py-1 pr-1 pl-3 text-sm font-medium">
                {formatDate(d, "short")}
                <button type="button" onClick={() => setLeave(leave.filter((x) => x !== d))} aria-label={`Remove leave on ${formatDate(d)}`} className="grid size-6 place-items-center rounded-full hover:bg-line">
                  <Icon name="close" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No leave planned.</p>
        )}
      </section>

      {canEditSchedule && (
        <section className="space-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h3 className="text-lg font-bold">Schedule &amp; visibility</h3>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Working days</legend>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((dayName, i) => (
                <label key={dayName} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm has-checked:border-brand has-checked:bg-brand-soft">
                  <input type="checkbox" checked={days.includes(i)} onChange={(e) => setDays(e.target.checked ? [...days, i] : days.filter((d) => d !== i))} />
                  {dayName.slice(0, 3)}
                </label>
              ))}
            </div>
            {errors.days && <p className="mt-1 text-sm font-medium text-danger">{errors.days}</p>}
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="p-start" label="From" error={errors.hours}>
              <input id="p-start" type="time" step={300} value={start} onChange={(e) => setStart(e.target.value)} className={input} />
            </Field>
            <Field id="p-end" label="Until">
              <input id="p-end" type="time" step={300} value={end} onChange={(e) => setEnd(e.target.value)} className={input} />
            </Field>
            <Field id="p-slot" label="Appointment length" error={errors.slotMinutes}>
              <select id="p-slot" value={slotMinutes} onChange={(e) => setSlotMinutes(Number(e.target.value))} className={input}>
                {doctorLimits.slotLengths.map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-bg-alt p-4">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-5" />
            <span>
              <span className="block font-semibold">Published</span>
              <span className="block text-sm text-muted">Shown on the website and bookable by patients.</span>
            </span>
          </label>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="rounded-xl bg-brand px-6 py-3 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-60">
          {busy ? "Saving…" : "Save changes"}
        </button>
        <p aria-live="polite" className="text-sm font-medium text-brand">
          {status}
        </p>
      </div>
    </form>
  );
}
