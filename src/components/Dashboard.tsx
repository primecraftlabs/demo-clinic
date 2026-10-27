"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clinic, retentionDays } from "@/config/clinic";
import {
  type Booking,
  type BookingSource,
  type BookingStatus,
  type Doctor,
  addDays,
  dateKey,
  formatDate,
  formatTime,
  normalizePhone,
  sortBookings,
} from "@/lib/booking";
import { reminderText, whatsappToPatient } from "@/lib/messages";
import { queueOrder } from "@/lib/queue";
import type { BookingScope, BookingStore } from "@/services";
import { AddBookingForm } from "./AddBookingForm";
import { useNow } from "./hooks";
import { DoctorAvatar } from "./ui";

const statusStyles: Record<BookingStatus, { label: string; style: string }> = {
  booked: { label: "Booked", style: "bg-brand-soft text-brand-strong" },
  arrived: { label: "Arrived", style: "bg-brand text-on-brand" },
  completed: { label: "Completed", style: "bg-info-bg text-info-fg" },
  noshow: { label: "No-show", style: "bg-danger-bg text-danger" },
  cancelled: { label: "Cancelled", style: "bg-bg-alt text-muted line-through" },
};

const sourceLabels: Record<BookingSource, string> = { online: "Online", phone: "Phone", walkin: "Walk-in" };

/** Words used in the "{name} marked as ..." message. */
const statusWords: Partial<Record<BookingStatus, string>> = { completed: "completed", noshow: "a no-show", cancelled: "cancelled" };

const actionButton = "rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-bg-alt";

type Action = "checkin" | BookingStatus;

function BookingRow({
  booking,
  doctors,
  today,
  onAction,
}: {
  booking: Booking;
  doctors: Doctor[];
  today: string;
  onAction: (b: Booking, action: Action) => void;
}) {
  const index = doctors.findIndex((d) => d.id === booking.doctorId);
  const doctor = doctors[index];
  const status = statusStyles[booking.status];
  const phone = normalizePhone(booking.phone);
  const reminderUrl =
    booking.status === "booked" && phone && doctor
      ? whatsappToPatient(phone, clinic.phoneCountryCode, reminderText(booking, doctor, clinic.name, clinic.arrivalNote))
      : null;
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <div className="flex items-center justify-between gap-3 sm:block sm:w-24 sm:shrink-0">
        <div>
          <p className="text-lg font-bold">{formatTime(booking.time)}</p>
          <p className="text-sm text-muted">{formatDate(booking.date, "short")}</p>
        </div>
        {booking.status === "arrived" && booking.token > 0 && (
          <p className="rounded-xl bg-brand px-3 py-1.5 text-center text-lg font-bold whitespace-nowrap text-on-brand sm:mt-2">
            Token {booking.token}
          </p>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold break-words">
          {booking.name}{" "}
          <span className="ml-1 inline-block rounded-full border border-line px-2 py-0.5 align-middle text-xs font-medium text-muted">
            {sourceLabels[booking.source] ?? sourceLabels.online}
          </span>
        </p>
        <p className="text-sm break-words text-muted">
          {booking.phone} · {booking.reason || "No reason given"}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted">{booking.code}</p>
      </div>
      {doctor && (
        <div className="flex items-center gap-2 sm:w-52">
          <DoctorAvatar doctor={doctor} index={index} size="size-9 text-sm" />
          <div className="text-sm">
            <p className="font-medium">{doctor.name}</p>
            <p className="text-muted">{doctor.speciality}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 sm:w-72 sm:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.style}`}>{status.label}</span>
        {booking.status === "booked" && (
          <>
            <button
              type="button"
              onClick={() => onAction(booking, "checkin")}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-on-brand hover:bg-brand-strong"
              aria-label={`Check in ${booking.name}`}
            >
              Check in
            </button>
            {booking.date <= today && (
              <button
                type="button"
                onClick={() => onAction(booking, "noshow")}
                className={actionButton}
                aria-label={`Mark ${booking.name} as a no-show`}
              >
                No-show
              </button>
            )}
            <button
              type="button"
              onClick={() => onAction(booking, "cancelled")}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-bg"
              aria-label={`Cancel ${booking.name}'s appointment`}
            >
              Cancel
            </button>
            {reminderUrl && (
              <a
                href={reminderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand hover:bg-bg-alt"
                aria-label={`Send ${booking.name} a WhatsApp reminder (opens WhatsApp)`}
              >
                WhatsApp reminder
              </a>
            )}
          </>
        )}
        {booking.status === "arrived" && (
          <button
            type="button"
            onClick={() => onAction(booking, "completed")}
            className={actionButton}
            aria-label={`Mark ${booking.name}'s visit as completed`}
          >
            Completed
          </button>
        )}
      </div>
    </li>
  );
}

function Group({
  title,
  items,
  doctors,
  today,
  onAction,
}: {
  title: string;
  items: Booking[];
  doctors: Doctor[];
  today: string;
  onAction: (b: Booking, action: Action) => void;
}) {
  const id = `group-${title.toLowerCase()}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-lg font-bold">
        {title} <span className="text-muted">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">No appointments here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <BookingRow key={b.id} booking={b} doctors={doctors} today={today} onAction={onAction} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Appointment list and today's queue. Works with any BookingStore (live database or sample preview) and any
 *  scope (the admin sees everyone's, a doctor only their own). */
export function Dashboard({
  store,
  scope,
  doctors,
  cleanUp = false,
}: {
  store: BookingStore;
  scope: BookingScope;
  doctors: Doctor[];
  cleanUp?: boolean;
}) {
  const now = useNow();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);

  const scopeDoctor = scope.doctorId;
  useEffect(
    () => store.watch({ doctorId: scopeDoctor }, setBookings, () => setMessage("Couldn't load bookings. Check your connection and reload.")),
    [store, scopeDoctor],
  );

  // Keep patient data short-lived: remove bookings older than the retention period (live dashboard only).
  useEffect(() => {
    if (!cleanUp || !now) return;
    store
      .removeBefore(addDays(dateKey(now), -retentionDays))
      .then((n) => n > 0 && setMessage(`Removed ${n} booking${n === 1 ? "" : "s"} older than ${retentionDays} days.`))
      .catch(() => {});
  }, [store, cleanUp, now]);

  if (!now || !bookings) return <p className="text-muted">Loading appointments…</p>;

  const today = dateKey(now);
  const visible = sortBookings(bookings).filter((b) => doctorFilter === "all" || b.doctorId === doctorFilter);
  const forToday = bookings.filter((b) => b.date === today);

  async function act(booking: Booking, action: Action) {
    if (action === "cancelled" && !window.confirm(`Cancel ${booking.name}'s appointment? The time becomes free for others.`)) return;
    try {
      if (action === "checkin") {
        const token = await store.checkIn(booking);
        setMessage(`${booking.name} checked in - token ${token}.`);
      } else {
        await store.setStatus(booking, action);
        setMessage(`${booking.name} marked as ${statusWords[action] ?? statusStyles[action].label}.`);
      }
    } catch {
      setMessage("Couldn't save the change. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Waiting now", value: forToday.filter((b) => b.status === "arrived").length },
          { label: "Still to see today", value: forToday.filter((b) => b.status === "booked").length },
          { label: "Booked for coming days", value: bookings.filter((b) => b.status === "booked" && b.date > today).length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setAdding((a) => !a)}
          aria-expanded={adding}
          aria-controls="add-booking"
          className="w-full rounded-xl border border-brand bg-surface px-5 py-3 font-semibold text-brand hover:bg-brand-soft sm:w-auto"
        >
          {adding ? "Close the form" : "Add phone / walk-in booking"}
        </button>
        {adding && (
          <div id="add-booking" className="mt-4">
            <AddBookingForm
              store={store}
              doctors={doctors}
              fixedDoctorId={scopeDoctor}
              onDone={(m) => {
                setMessage(m);
                setAdding(false);
              }}
            />
          </div>
        )}
      </div>

      {!scopeDoctor && (
        <div className="rounded-2xl border border-line bg-surface p-4">
          <label htmlFor="doctor-filter" className="mb-1.5 block text-sm font-semibold">
            Filter by doctor
          </label>
          <select
            id="doctor-filter"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 sm:w-64"
          >
            <option value="all">All doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <p aria-live="polite" className="min-h-6 text-sm font-medium text-brand">
        {message}
      </p>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-lg font-semibold">No bookings yet</p>
          <p className="mt-1 text-muted">New online bookings appear here instantly. Add phone and walk-in bookings with the button above.</p>
          <Link href="/book/" className="mt-5 inline-block rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong">
            Open the booking page
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <Group title="Today" items={queueOrder(visible.filter((b) => b.date === today))} doctors={doctors} today={today} onAction={act} />
          <Group title="Upcoming" items={visible.filter((b) => b.date > today)} doctors={doctors} today={today} onAction={act} />
          {visible.some((b) => b.date < today) && (
            <Group title="Earlier" items={visible.filter((b) => b.date < today)} doctors={doctors} today={today} onAction={act} />
          )}
        </div>
      )}
    </div>
  );
}
