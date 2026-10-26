"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { bookingRules, calendar, clinic, concept } from "@/config/clinic";
import { doctors, getDoctor } from "@/data/doctors";
import {
  type Booking,
  type BookingErrors,
  availableSlots,
  dateKey,
  formatDate,
  formatTime,
  makeBookingCode,
  nextDays,
  normalizePhone,
  validateBooking,
  worksOn,
} from "@/lib/booking";
import { googleCalendarUrl, icsFile, type CalendarEvent } from "@/lib/calendar";
import { bookingWhatsappText } from "@/lib/messages";
import { type BookingStore, SlotTakenError, liveBookingStore, notifier, onlineBookingAvailable } from "@/services";
import { useNow } from "./hooks";
import { Icon } from "./Icons";
import { DoctorAvatar, Notice, hoursLabel } from "./ui";

const chip =
  "block cursor-pointer rounded-xl border border-line bg-surface px-3 py-2.5 text-center font-medium transition hover:border-brand peer-checked:border-brand peer-checked:bg-brand peer-checked:text-on-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:cursor-not-allowed peer-disabled:border-line peer-disabled:bg-bg-alt peer-disabled:text-muted/60 peer-disabled:line-through";

function StepTitle({ n, children }: { n: number; children: string }) {
  return (
    <legend className="float-left mb-4 flex w-full items-center gap-3 text-lg font-bold">
      <span className="grid size-8 place-items-center rounded-full bg-brand text-sm text-on-brand">{n}</span>
      {children}
    </legend>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm font-medium text-danger">
      {message}
    </p>
  );
}

type Taken = { key: string; times: string[] } | null;

export function BookingFlow() {
  if (!onlineBookingAvailable) {
    return <Notice>Online booking is being set up. Please message us on WhatsApp to book in the meantime.</Notice>;
  }
  return <BookingForm />;
}

function BookingForm() {
  const searchParams = useSearchParams();
  const now = useNow();
  const storeRef = useRef<Promise<BookingStore> | null>(null);
  const getStore = () => (storeRef.current ??= liveBookingStore());

  const [doctorId, setDoctorId] = useState(() => getDoctor(searchParams.get("doctor"))?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [taken, setTaken] = useState<Taken>(null);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  const doctor = getDoctor(doctorId);
  const days = now ? nextDays(now, bookingRules.daysAhead) : [];
  const currentKey = `${doctorId}|${date}`;
  const takenTimes = taken?.key === currentKey ? taken.times : null;
  const slots = doctor && date && now && takenTimes ? availableSlots(doctor, date, takenTimes, now) : [];
  const freeCount = slots.filter((s) => s.state === "free").length;

  async function loadTaken(forDoctor: string, forDate: string) {
    if (!forDoctor || !forDate) return;
    try {
      const times = await (await getStore()).takenTimes(forDoctor, forDate);
      setTaken({ key: `${forDoctor}|${forDate}`, times });
      setProblem("");
    } catch {
      setProblem("We couldn't load free times. Please check your internet connection and try again.");
    }
  }

  function chooseDoctor(id: string) {
    setDoctorId(id);
    const next = getDoctor(id);
    const keepDate = next && date && worksOn(next, new Date(`${date}T00:00`)) ? date : "";
    setDate(keepDate);
    setTime("");
    void loadTaken(id, keepDate);
  }

  function chooseDate(key: string) {
    setDate(key);
    setTime("");
    void loadTaken(doctorId, key);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const found = validateBooking({ doctor, date, time, name, phone, reason }, takenTimes ?? [], new Date(), bookingRules);
    setErrors(found);
    setProblem("");
    if (Object.keys(found).length > 0 || !doctor) return;

    setSaving(true);
    try {
      const store = await getStore();
      const booking = await store.create(
        { doctorId: doctor.id, date, time, name: name.trim(), phone: normalizePhone(phone) ?? phone, reason: reason.trim() },
        makeBookingCode(date, bookingRules.codePrefix),
      );
      notifier.bookingCreated(booking, doctor).catch(() => {}); // the booking is saved either way
      setConfirmed(booking);
    } catch (error) {
      if (error instanceof SlotTakenError) {
        setErrors({ time: "Sorry, someone just booked this time. Please choose another slot." });
        setTime("");
        await loadTaken(doctor.id, date);
      } else {
        setProblem("We couldn't save your booking. Please check your internet connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  function bookAnother() {
    setConfirmed(null);
    setDate("");
    setTime("");
    setName("");
    setPhone("");
    setReason("");
    setErrors({});
    setTaken(null);
  }

  if (confirmed) return <Confirmation booking={confirmed} onBookAnother={bookAnother} />;

  const errorList = Object.values(errors).filter(Boolean);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        <div aria-live="polite">
          {errorList.length > 0 && (
            <div className="rounded-xl border border-danger/30 bg-danger-bg p-4 text-danger" role="alert">
              <p className="font-semibold">Please fix {errorList.length === 1 ? "this" : "these"} to continue:</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {errorList.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {problem && (
            <p className="rounded-xl border border-danger/30 bg-danger-bg p-4 font-medium text-danger" role="alert">
              {problem}
            </p>
          )}
        </div>

        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-describedby={errors.doctor ? "err-doctor" : undefined}>
          <StepTitle n={1}>Choose a doctor</StepTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {doctors.map((d, i) => (
              <div key={d.id}>
                <input
                  type="radio"
                  name="doctor"
                  id={`doctor-${d.id}`}
                  value={d.id}
                  checked={doctorId === d.id}
                  onChange={() => chooseDoctor(d.id)}
                  className="peer sr-only"
                />
                <label
                  htmlFor={`doctor-${d.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition hover:border-brand peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:ring-2 peer-checked:ring-brand peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
                >
                  <DoctorAvatar doctor={d} index={i} size="size-11 text-base" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{d.name}</span>
                    <span className="block text-sm text-muted">
                      {d.speciality} · {hoursLabel(d)}
                    </span>
                  </span>
                </label>
              </div>
            ))}
          </div>
          <FieldError id="err-doctor" message={errors.doctor} />
        </fieldset>

        <fieldset
          disabled={!doctor}
          className="rounded-2xl border border-line bg-surface p-5 disabled:opacity-60 sm:p-6"
          aria-describedby={errors.date ? "err-date" : undefined}
        >
          <StepTitle n={2}>Pick a day</StepTitle>
          {!doctor && <p className="text-sm text-muted">Choose a doctor first to see their available days.</p>}
          {doctor && !now && <p className="text-sm text-muted">Loading available days…</p>}
          {doctor && now && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {days.map((day) => {
                const key = dateKey(day);
                const available = worksOn(doctor, day);
                return (
                  <div key={key}>
                    <input
                      type="radio"
                      name="date"
                      id={`date-${key}`}
                      value={key}
                      checked={date === key}
                      disabled={!available}
                      onChange={() => chooseDate(key)}
                      className="peer sr-only"
                    />
                    <label htmlFor={`date-${key}`} className={chip}>
                      <span className="block text-xs uppercase opacity-80">
                        {key === dateKey(now) ? "Today" : day.toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                      <span className="block text-lg leading-tight font-bold">{day.getDate()}</span>
                      <span className="block text-xs opacity-80">{day.toLocaleDateString("en-IN", { month: "short" })}</span>
                      {!available && <span className="sr-only"> (doctor not available)</span>}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
          <FieldError id="err-date" message={errors.date} />
        </fieldset>

        <fieldset
          disabled={!doctor || !date}
          className="rounded-2xl border border-line bg-surface p-5 disabled:opacity-60 sm:p-6"
          aria-describedby={errors.time ? "err-time" : undefined}
        >
          <StepTitle n={3}>Choose a time</StepTitle>
          {(!doctor || !date) && <p className="text-sm text-muted">Pick a day to see free time slots.</p>}
          {doctor && date && !takenTimes && <p className="text-sm text-muted">Checking free times…</p>}
          {doctor && date && takenTimes && (
            <>
              <p className="mb-3 text-sm text-muted" aria-live="polite">
                {freeCount > 0
                  ? `${freeCount} free slot${freeCount === 1 ? "" : "s"} on ${formatDate(date)}. Crossed-out times are already booked.`
                  : `No free slots left on ${formatDate(date)}. Please choose another day.`}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {slots.map((slot) => (
                  <div key={slot.time}>
                    <input
                      type="radio"
                      name="time"
                      id={`time-${slot.time}`}
                      value={slot.time}
                      checked={time === slot.time}
                      disabled={slot.state !== "free"}
                      onChange={() => setTime(slot.time)}
                      className="peer sr-only"
                    />
                    <label htmlFor={`time-${slot.time}`} className={chip}>
                      {formatTime(slot.time)}
                      {slot.state !== "free" && <span className="sr-only"> ({slot.state === "past" ? "already passed" : "booked"})</span>}
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
          <FieldError id="err-time" message={errors.time} />
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <StepTitle n={4}>Patient details</StepTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
                Patient name *
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={bookingRules.maxNameLength}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "err-name" : undefined}
                className="w-full rounded-xl border border-line px-4 py-3 aria-invalid:border-danger"
              />
              <FieldError id="err-name" message={errors.name} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">
                Mobile number *
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="10-digit mobile number"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "err-phone" : undefined}
                className="w-full rounded-xl border border-line px-4 py-3 aria-invalid:border-danger"
              />
              <FieldError id="err-phone" message={errors.phone} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="reason" className="mb-1.5 block text-sm font-semibold">
                Reason for visit <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="reason"
                rows={3}
                maxLength={bookingRules.maxReasonLength}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-invalid={!!errors.reason}
                aria-describedby={errors.reason ? "err-reason" : undefined}
                className="w-full rounded-xl border border-line px-4 py-3 aria-invalid:border-danger"
              />
              <FieldError id="err-reason" message={errors.reason} />
            </div>
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-bold">Your appointment</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Doctor</dt>
              <dd className="text-right font-semibold">{doctor?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Day</dt>
              <dd className="text-right font-semibold">{date ? formatDate(date) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Time</dt>
              <dd className="text-right font-semibold">{time ? formatTime(time) : "—"}</dd>
            </div>
          </dl>
          <button
            type="submit"
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-brand px-5 py-3.5 font-semibold text-on-brand hover:bg-brand-strong disabled:opacity-60"
          >
            {saving ? "Booking…" : "Confirm appointment"}
          </button>
          <div className="mt-4">
            <Notice>{concept.bookingNotice}</Notice>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Confirmation({ booking, onBookAnother }: { booking: Booking; onBookAnother: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const d = getDoctor(booking.doctorId)!;
  useEffect(() => titleRef.current?.focus(), []);

  const event: CalendarEvent = {
    title: `${d.name} at ${clinic.name}`,
    details: `Booking ${booking.code}. ${clinic.arrivalNote}`,
    location: `${clinic.name}, ${clinic.area}`,
    date: booking.date,
    time: booking.time,
    minutes: d.slotMinutes,
    timeZone: clinic.timeZone,
    uid: `${booking.id}@${clinic.shortName.toLowerCase()}`,
  };
  const whatsapp = `${clinic.whatsappUrl}?text=${encodeURIComponent(bookingWhatsappText(booking, d, clinic.name, concept.whatsappPrefix))}`;

  function downloadIcs() {
    const url = URL.createObjectURL(new Blob([icsFile(event)], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${booking.code}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const action = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold";
  return (
    <div role="status" className="mx-auto max-w-2xl rounded-3xl border border-brand/30 bg-surface p-6 shadow-lg sm:p-8">
      <div className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon name="check" className="size-8" />
      </div>
      <h2 ref={titleRef} tabIndex={-1} className="mt-5 text-2xl font-bold outline-none">
        Appointment confirmed
      </h2>
      <p className="mt-2 text-muted">{clinic.arrivalNote}</p>
      <dl className="mt-6 grid gap-4 rounded-2xl bg-bg-alt p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">Booking code</dt>
          <dd className="font-mono text-lg font-bold tracking-wide">{booking.code}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Patient</dt>
          <dd className="font-semibold break-words">{booking.name}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Doctor</dt>
          <dd className="font-semibold">
            {d.name} · {d.speciality}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">When</dt>
          <dd className="font-semibold">
            {formatDate(booking.date)}, {formatTime(booking.time)}
          </dd>
        </div>
      </dl>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a href={googleCalendarUrl(calendar.googleUrl, event)} target="_blank" rel="noopener noreferrer" className={`${action} bg-brand text-on-brand hover:bg-brand-strong`}>
          <Icon name="calendar" /> Add to Google Calendar
        </a>
        <button type="button" onClick={downloadIcs} className={`${action} border border-line hover:bg-bg-alt`}>
          <Icon name="download" /> Calendar file (.ics)
        </button>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${action} border border-line hover:bg-bg-alt`}>
          <Icon name="whatsapp" /> Message us on WhatsApp
        </a>
        <button type="button" onClick={onBookAnother} className={`${action} border border-line hover:bg-bg-alt`}>
          Book another appointment
        </button>
      </div>
      <div className="mt-6">
        <Notice>{concept.bookingNotice}</Notice>
      </div>
    </div>
  );
}
