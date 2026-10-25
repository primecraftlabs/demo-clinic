"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  type Booking,
  type BookingErrors,
  availableSlots,
  dateKey,
  formatDate,
  formatTime,
  makeBookingId,
  nextDays,
  normalizePhone,
  validateBooking,
  worksOn,
} from "@/lib/booking";
import { bookingRules, clinic, demoStorageNote } from "@/config/clinic";
import { doctors, getDoctor } from "@/data/doctors";
import {
  getBookingsSnapshot,
  getNowSnapshot,
  getServerBookings,
  getServerNow,
  saveBookings,
  subscribeBookings,
  subscribeNow,
} from "@/lib/storage";
import { Icon } from "./Icons";
import { DemoNote, DoctorAvatar, hoursLabel } from "./ui";

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

export function BookingFlow() {
  const searchParams = useSearchParams();
  const bookings = useSyncExternalStore(subscribeBookings, getBookingsSnapshot, getServerBookings);
  const now = useSyncExternalStore(subscribeNow, getNowSnapshot, getServerNow);

  const [doctorId, setDoctorId] = useState(() => getDoctor(searchParams.get("doctor"))?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<BookingErrors>({});
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [savedToBrowser, setSavedToBrowser] = useState(true);
  const confirmRef = useRef<HTMLHeadingElement>(null);

  const doctor = getDoctor(doctorId);
  const days = now ? nextDays(now, bookingRules.daysAhead) : [];
  const slots = doctor && date && now ? availableSlots(doctor, date, bookings, now, bookingRules) : [];
  const freeCount = slots.filter((s) => s.state === "free").length;

  useEffect(() => {
    if (confirmed) confirmRef.current?.focus();
  }, [confirmed]);

  function chooseDoctor(id: string) {
    setDoctorId(id);
    const next = getDoctor(id);
    if (next && date && !worksOn(next, new Date(`${date}T00:00`))) setDate("");
    setTime("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const at = new Date();
    const found = validateBooking({ doctor, date, time, name, phone, reason }, bookings, at, bookingRules);
    setErrors(found);
    if (Object.keys(found).length > 0 || !doctor) return;

    const booking: Booking = {
      id: makeBookingId(date, bookingRules.idPrefix),
      doctorId: doctor.id,
      date,
      time,
      name: name.trim(),
      phone: normalizePhone(phone) ?? phone,
      reason: reason.trim(),
      status: "booked",
      createdAt: at.toISOString(),
    };
    setSavedToBrowser(saveBookings([...bookings, booking]));
    setConfirmed(booking);
  }

  function bookAnother() {
    setConfirmed(null);
    setDate("");
    setTime("");
    setName("");
    setPhone("");
    setReason("");
    setErrors({});
  }

  if (confirmed) {
    const d = getDoctor(confirmed.doctorId)!;
    return (
      <div role="status" className="mx-auto max-w-2xl rounded-3xl border border-brand/30 bg-surface p-8 shadow-lg">
        <div className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon name="check" className="size-8" />
        </div>
        <h2 ref={confirmRef} tabIndex={-1} className="mt-5 text-2xl font-bold outline-none">
          Appointment confirmed
        </h2>
        <p className="mt-2 text-muted">{clinic.arrivalNote}</p>
        <dl className="mt-6 grid gap-4 rounded-2xl bg-bg-alt p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Booking ID</dt>
            <dd className="font-mono text-lg font-bold tracking-wide">{confirmed.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Patient</dt>
            <dd className="font-semibold">{confirmed.name}</dd>
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
              {formatDate(confirmed.date)}, {formatTime(confirmed.time)}
            </dd>
          </div>
        </dl>
        <div className="mt-6">
          <DemoNote>
            {demoStorageNote}
            {!savedToBrowser && " (Your browser blocked storage, so this booking will disappear when you leave the page.)"}
          </DemoNote>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/" className="rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong">
            View in clinic dashboard
          </Link>
          <button type="button" onClick={bookAnother} className="rounded-xl border border-line px-5 py-3 font-semibold hover:bg-bg-alt">
            Book another appointment
          </button>
        </div>
      </div>
    );
  }

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
                  <span>
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
                      onChange={() => {
                        setDate(key);
                        setTime("");
                      }}
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
          {doctor && date && (
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
                aria-describedby={errors.phone ? "err-phone" : "phone-hint"}
                className="w-full rounded-xl border border-line px-4 py-3 aria-invalid:border-danger"
              />
              <p id="phone-hint" className="mt-1.5 text-xs text-muted">
                In this demo nothing is sent anywhere. Try any 10-digit number starting with 6–9.
              </p>
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
          <button type="submit" className="mt-6 w-full rounded-xl bg-brand px-5 py-3.5 font-semibold text-on-brand hover:bg-brand-strong">
            Confirm appointment
          </button>
          <div className="mt-4">
            <DemoNote>{demoStorageNote}</DemoNote>
          </div>
        </div>
      </aside>
    </form>
  );
}
