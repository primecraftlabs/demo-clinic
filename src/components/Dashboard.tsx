"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { type Booking, type BookingStatus, dateKey, formatDate, formatTime, sortBookings } from "@/lib/booking";
import { demoStorageNote } from "@/config/clinic";
import { doctors, getDoctor } from "@/data/doctors";
import {
  clearBookings,
  getBookingsSnapshot,
  getNowSnapshot,
  getServerBookings,
  getServerNow,
  sampleBookings,
  saveBookings,
  subscribeBookings,
  subscribeNow,
} from "@/lib/storage";
import { DemoNote, DoctorAvatar } from "./ui";

const statusStyles: Record<BookingStatus, string> = {
  booked: "bg-brand-soft text-brand-strong",
  completed: "bg-info-bg text-info-fg",
  cancelled: "bg-bg-alt text-muted line-through",
};

function BookingRow({ booking, onStatus }: { booking: Booking; onStatus: (id: string, status: BookingStatus) => void }) {
  const doctor = getDoctor(booking.doctorId);
  const index = doctors.findIndex((d) => d.id === booking.doctorId);
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <div className="w-24 shrink-0">
        <p className="text-lg font-bold">{formatTime(booking.time)}</p>
        <p className="text-sm text-muted">{formatDate(booking.date, "short")}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {booking.name}
          {booking.sample && <span className="ml-2 rounded bg-bg-alt px-1.5 py-0.5 text-xs font-medium text-muted">sample</span>}
        </p>
        <p className="text-sm break-words text-muted">
          {booking.phone} · {booking.reason || "No reason given"}
        </p>
        <p className="mt-0.5 font-mono text-xs text-muted">{booking.id}</p>
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
              onClick={() => onStatus(booking.id, "completed")}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-bg-alt"
              aria-label={`Mark ${booking.name}'s visit as completed`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => onStatus(booking.id, "cancelled")}
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

function Group({ title, items, onStatus }: { title: string; items: Booking[]; onStatus: (id: string, s: BookingStatus) => void }) {
  return (
    <section aria-labelledby={`group-${title}`}>
      <h2 id={`group-${title}`} className="mb-3 text-lg font-bold">
        {title} <span className="text-muted">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-5 text-sm text-muted">No appointments here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((b) => (
            <BookingRow key={b.id} booking={b} onStatus={onStatus} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function Dashboard() {
  const bookings = useSyncExternalStore(subscribeBookings, getBookingsSnapshot, getServerBookings);
  const now = useSyncExternalStore(subscribeNow, getNowSnapshot, getServerNow);
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [message, setMessage] = useState("");

  if (!now) return <p className="text-muted">Loading appointments…</p>;

  const today = dateKey(now);
  const visible = sortBookings(bookings).filter((b) => doctorFilter === "all" || b.doctorId === doctorFilter);
  const todays = visible.filter((b) => b.date === today);
  const upcoming = visible.filter((b) => b.date > today);
  const earlier = visible.filter((b) => b.date < today);
  const active = bookings.filter((b) => b.status === "booked");

  function setStatus(id: string, status: BookingStatus) {
    saveBookings(bookings.map((b) => (b.id === id ? { ...b, status } : b)));
    const booking = bookings.find((b) => b.id === id);
    setMessage(`${booking?.name ?? "Booking"} marked as ${status}.`);
  }

  function loadSamples() {
    const added = sampleBookings(now!, bookings);
    saveBookings([...bookings, ...added]);
    setMessage(`Added ${added.length} sample bookings.`);
  }

  function clearAll() {
    if (!window.confirm("Delete all demo bookings saved in this browser?")) return;
    clearBookings();
    setMessage("All demo bookings were cleared.");
  }

  return (
    <div className="space-y-8">
      <DemoNote>{demoStorageNote}</DemoNote>

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

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
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
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={loadSamples} className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:bg-bg-alt">
            Load sample bookings
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={bookings.length === 0}
            className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
          >
            Clear demo data
          </button>
        </div>
      </div>

      <p aria-live="polite" className="min-h-6 text-sm font-medium text-brand">
        {message}
      </p>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-lg font-semibold">No bookings yet</p>
          <p className="mt-1 text-muted">Make a booking, or load sample bookings to see how the dashboard works.</p>
          <Link href="/book/" className="mt-5 inline-block rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong">
            Book an appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <Group title="Today" items={todays} onStatus={setStatus} />
          <Group title="Upcoming" items={upcoming} onStatus={setStatus} />
          {earlier.length > 0 && <Group title="Earlier" items={earlier} onStatus={setStatus} />}
        </div>
      )}
    </div>
  );
}
