"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { retentionDays } from "@/config/clinic";
import { type Booking, type BookingStatus, type Doctor, addDays, dateKey, formatDate, formatTime, sortBookings } from "@/lib/booking";
import type { BookingScope, BookingStore } from "@/services";
import { useNow } from "./hooks";
import { DoctorAvatar } from "./ui";

const statusStyles: Record<BookingStatus, string> = {
  booked: "bg-brand-soft text-brand-strong",
  completed: "bg-info-bg text-info-fg",
  cancelled: "bg-bg-alt text-muted line-through",
};

function BookingRow({ booking, doctors, onStatus }: { booking: Booking; doctors: Doctor[]; onStatus: (b: Booking, status: BookingStatus) => void }) {
  const index = doctors.findIndex((d) => d.id === booking.doctorId);
  const doctor = doctors[index];
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <div className="w-24 shrink-0">
        <p className="text-lg font-bold">{formatTime(booking.time)}</p>
        <p className="text-sm text-muted">{formatDate(booking.date, "short")}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold break-words">{booking.name}</p>
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
      <div className="flex flex-wrap items-center gap-2 sm:w-72 sm:flex-nowrap sm:justify-end">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[booking.status]}`}>{booking.status}</span>
        {booking.status === "booked" && (
          <>
            <button
              type="button"
              onClick={() => onStatus(booking, "completed")}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-bg-alt"
              aria-label={`Mark ${booking.name}'s visit as completed`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => onStatus(booking, "cancelled")}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-bg"
              aria-label={`Cancel ${booking.name}'s appointment`}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function Group({ title, items, doctors, onStatus }: { title: string; items: Booking[]; doctors: Doctor[]; onStatus: (b: Booking, s: BookingStatus) => void }) {
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
            <BookingRow key={b.id} booking={b} doctors={doctors} onStatus={onStatus} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Appointment list. Works with any BookingStore (live database or sample preview) and any scope
 *  (the admin sees everyone's, a doctor only their own). */
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
  const active = bookings.filter((b) => b.status === "booked");

  async function setStatus(booking: Booking, status: BookingStatus) {
    if (status === "cancelled" && !window.confirm(`Cancel ${booking.name}'s appointment? The time becomes free for others.`)) return;
    try {
      await store.setStatus(booking, status);
      setMessage(`${booking.name} marked as ${status}.`);
    } catch {
      setMessage("Couldn't save the change. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Still to see today", value: active.filter((b) => b.date === today).length },
          { label: "Booked for coming days", value: active.filter((b) => b.date > today).length },
          { label: "Completed visits", value: bookings.filter((b) => b.status === "completed").length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-3xl font-bold">{s.value}</p>
          </div>
        ))}
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
          <p className="mt-1 text-muted">New online bookings appear here instantly.</p>
          <Link href="/book/" className="mt-5 inline-block rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong">
            Open the booking page
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <Group title="Today" items={visible.filter((b) => b.date === today)} doctors={doctors} onStatus={setStatus} />
          <Group title="Upcoming" items={visible.filter((b) => b.date > today)} doctors={doctors} onStatus={setStatus} />
          {visible.some((b) => b.date < today) && (
            <Group title="Earlier" items={visible.filter((b) => b.date < today)} doctors={doctors} onStatus={setStatus} />
          )}
        </div>
      )}
    </div>
  );
}
