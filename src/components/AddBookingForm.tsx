"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import { bookingRules, privacy } from "@/config/clinic";
import {
  type BookingSource,
  type Doctor,
  dateKey,
  formatDate,
  formatTime,
  makeBookingCode,
  nextDays,
  normalizePhone,
  onLeave,
  slotTimes,
  toMinutes,
  worksOn,
} from "@/lib/booking";
import { type BookingStore, SlotTakenError } from "@/services";
import { useClinicHolidays, useNow } from "./hooks";

const chip =
  "block cursor-pointer rounded-xl border border-line bg-surface px-3 py-2 text-center text-sm font-medium transition hover:border-brand peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand";
const input = "w-full rounded-xl border border-line bg-surface px-3 py-2.5";
const label = "mb-1.5 block text-sm font-semibold";

type StaffSource = Exclude<BookingSource, "online">;
const sources: { value: StaffSource; label: string }[] = [
  { value: "walkin", label: "Walk-in" },
  { value: "phone", label: "Phone call" },
];

type Errors = Partial<Record<"doctor" | "date" | "time" | "name" | "phone" | "consent", string>>;

/** Staff form for bookings made by phone or at the front desk. Talks only to the BookingStore interface. */
export function AddBookingForm({
  store,
  doctors,
  fixedDoctorId,
  onDone,
}: {
  store: BookingStore;
  doctors: Doctor[];
  fixedDoctorId?: string;
  onDone: (message: string) => void;
}) {
  const uid = useId();
  const now = useNow();
  const holidays = useClinicHolidays();
  const [doctorId, setDoctorId] = useState(fixedDoctorId ?? "");
  const [source, setSource] = useState<StaffSource>("walkin");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [taken, setTaken] = useState<string[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const request = useRef(0);

  const doctor = doctors.find((d) => d.id === doctorId);
  const today = now ? dateKey(now) : "";

  function loadTaken(forDoctor: string, forDate: string) {
    const id = ++request.current;
    setTaken(null);
    store.takenTimes(forDoctor, forDate).then(
      (t) => id === request.current && setTaken(t),
      () => {
        if (id !== request.current) return;
        setTaken([]);
        setFormError("Couldn't check the booked times. Please try again.");
      },
    );
  }

  function chooseDoctor(id: string) {
    setDoctorId(id);
    setDate("");
    setTime("");
    setTaken(null);
    request.current++;
  }

  function chooseDate(key: string) {
    setDate(key);
    setTime("");
    if (doctorId) loadTaken(doctorId, key);
  }

  const days =
    doctor && now && holidays
      ? nextDays(now, bookingRules.daysAhead).filter((d) => worksOn(doctor, d) && !holidays.includes(dateKey(d)))
      : [];

  // Free times; for today keep the slot that is running now (walk-ins can take it), drop the ones already over.
  const freeTimes =
    doctor && date && taken && now
      ? slotTimes(doctor).filter((t) => {
          if (taken.includes(t)) return false;
          if (date !== today) return true;
          return toMinutes(t) + doctor.slotMinutes > now.getHours() * 60 + now.getMinutes();
        })
      : [];

  function reset() {
    setDoctorId(fixedDoctorId ?? "");
    setSource("walkin");
    setDate("");
    setTime("");
    setTaken(null);
    setName("");
    setPhone("");
    setReason("");
    setConsent(false);
    setErrors({});
    setFormError("");
    request.current++;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const found: Errors = {};
    const cleanPhone = normalizePhone(phone);
    if (!doctor) found.doctor = "Please choose a doctor.";
    if (!date) found.date = "Please choose a date.";
    if (!time) found.time = "Please choose a time.";
    if (name.trim().length < 2) found.name = "Please enter the patient's name.";
    if (!cleanPhone) found.phone = "Please enter a valid 10-digit mobile number.";
    if (!consent) found.consent = "Please confirm the patient agreed.";
    setErrors(found);
    if (Object.keys(found).length > 0 || !doctor || !cleanPhone) return;

    setSaving(true);
    try {
      const booking = await store.create(
        { doctorId: doctor.id, date, time, name: name.trim(), phone: cleanPhone, reason: reason.trim() },
        makeBookingCode(date, bookingRules.codePrefix),
        source,
      );
      const token = source === "walkin" ? await store.checkIn(booking) : 0;
      onDone(`Booked ${booking.name} for ${formatTime(time)}${source === "walkin" ? `, token ${token}` : ""}.`);
      reset();
    } catch (err) {
      if (err instanceof SlotTakenError) {
        setTime("");
        setFormError("That time was just taken - pick another.");
        loadTaken(doctor.id, date);
      } else {
        setFormError("Couldn't save the booking. Please check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  const err = (key: keyof Errors) =>
    errors[key] && (
      <p id={`${uid}-err-${key}`} className="mt-1.5 text-sm font-medium text-danger">
        {errors[key]}
      </p>
    );
  const describedBy = (key: keyof Errors) => (errors[key] ? `${uid}-err-${key}` : undefined);

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {!fixedDoctorId && (
          <div>
            <label htmlFor={`${uid}-doctor`} className={label}>
              Doctor
            </label>
            <select
              id={`${uid}-doctor`}
              value={doctorId}
              onChange={(e) => chooseDoctor(e.target.value)}
              aria-describedby={describedBy("doctor")}
              className={input}
            >
              <option value="">Choose a doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} - {d.speciality}
                </option>
              ))}
            </select>
            {err("doctor")}
          </div>
        )}
        <fieldset>
          <legend className={label}>How did they book?</legend>
          <div className="grid grid-cols-2 gap-2">
            {sources.map((s) => (
              <div key={s.value}>
                <input
                  type="radio"
                  name={`${uid}-source`}
                  id={`${uid}-source-${s.value}`}
                  checked={source === s.value}
                  onChange={() => setSource(s.value)}
                  className="peer sr-only"
                />
                <label htmlFor={`${uid}-source-${s.value}`} className={chip}>
                  {s.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset aria-describedby={describedBy("date")}>
        <legend className={label}>Date</legend>
        {!doctor ? (
          <p className="text-sm text-muted">Choose a doctor first.</p>
        ) : !now || !holidays ? (
          <p className="text-sm text-muted">Loading days…</p>
        ) : days.length === 0 ? (
          <p className="text-sm text-muted">No working days in the next {bookingRules.daysAhead} days.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((d) => {
              const key = dateKey(d);
              const leave = onLeave(doctor, key);
              return (
                <div key={key}>
                  <input
                    type="radio"
                    name={`${uid}-date`}
                    id={`${uid}-date-${key}`}
                    checked={date === key}
                    onChange={() => chooseDate(key)}
                    className="peer sr-only"
                  />
                  <label htmlFor={`${uid}-date-${key}`} className={chip}>
                    <span className="block text-xs uppercase opacity-80">
                      {key === today ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                    <span className="block font-bold">
                      {d.getDate()} {d.toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                    {leave && <span className="block text-[10px] font-semibold uppercase">Leave</span>}
                  </label>
                </div>
              );
            })}
          </div>
        )}
        {err("date")}
      </fieldset>

      <fieldset aria-describedby={describedBy("time")}>
        <legend className={label}>Time</legend>
        {!doctor || !date ? (
          <p className="text-sm text-muted">Pick a date to see free times.</p>
        ) : !taken ? (
          <p className="text-sm text-muted">Checking free times…</p>
        ) : freeTimes.length === 0 ? (
          <p className="text-sm text-muted">No free times left on {formatDate(date)}.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
            {freeTimes.map((t) => (
              <div key={t}>
                <input
                  type="radio"
                  name={`${uid}-time`}
                  id={`${uid}-time-${t}`}
                  checked={time === t}
                  onChange={() => setTime(t)}
                  className="peer sr-only"
                />
                <label htmlFor={`${uid}-time-${t}`} className={chip}>
                  {formatTime(t)}
                  {date === today && toMinutes(t) <= (now ? now.getHours() * 60 + now.getMinutes() : 0) && (
                    <span className="block text-[10px] font-semibold uppercase">Now</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
        {err("time")}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-name`} className={label}>
            Patient name
          </label>
          <input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={bookingRules.maxNameLength}
            autoComplete="off"
            aria-describedby={describedBy("name")}
            className={input}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className={label}>
            Mobile number
          </label>
          <input
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="off"
            aria-describedby={describedBy("phone")}
            className={input}
          />
          {err("phone")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-reason`} className={label}>
            Reason <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id={`${uid}-reason`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={bookingRules.maxReasonLength}
            autoComplete="off"
            className={input}
          />
        </div>
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-describedby={describedBy("consent")}
            className="mt-0.5 size-5 shrink-0 accent-brand"
          />
          <span>{privacy.staffConsentText}</span>
        </label>
        {err("consent")}
      </div>

      <p aria-live="polite" className="text-sm font-medium text-danger empty:hidden">
        {formError}
      </p>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-60 sm:w-auto"
      >
        {saving ? "Saving…" : source === "walkin" ? "Book and check in" : "Book appointment"}
      </button>
    </form>
  );
}
