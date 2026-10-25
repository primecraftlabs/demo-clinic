import { bookingRules, samplePatients, storageKey as KEY } from "@/config/clinic";
import { doctors } from "@/data/doctors";
import { type Booking, dateKey, isPrebooked, makeBookingId, nextDays, slotTimes, worksOn } from "./booking";
const EMPTY: Booking[] = [];

// A tiny external store for useSyncExternalStore. Browser storage can be missing or blocked
// (private mode, previews), so every access is guarded and an in-memory copy keeps the demo working.
let memory: Booking[] = EMPTY;
let cachedRaw: string | null | undefined;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getBookingsSnapshot(): Booking[] {
  const raw = readRaw();
  if (raw === null) return memory;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = JSON.parse(raw);
      memory = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      memory = EMPTY;
    }
  }
  return memory;
}

export function getServerBookings(): Booking[] {
  return EMPTY;
}

export function subscribeBookings(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Saves bookings; returns false if the browser blocked storage (the demo then keeps them in memory). */
export function saveBookings(bookings: Booking[]): boolean {
  memory = bookings;
  let saved = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(bookings));
  } catch {
    saved = false;
  }
  listeners.forEach((l) => l());
  return saved;
}

export function clearBookings() {
  memory = EMPTY;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing stored
  }
  listeners.forEach((l) => l());
}

// "Now", read once on the client. Server render / prerender gets null, so time-based UI renders after hydration.
let clientNow: Date | null = null;
export function getNowSnapshot(): Date | null {
  clientNow ??= new Date();
  return clientNow;
}
export function getServerNow(): Date | null {
  return null;
}
export function subscribeNow() {
  return () => {};
}


/** Fills the dashboard with clearly-marked sample bookings for showing the demo. */
export function sampleBookings(now: Date, existing: Booking[]): Booking[] {
  const result: Booking[] = [];
  let p = 0;
  for (const day of nextDays(now, 3)) {
    for (const doctor of doctors) {
      if (!worksOn(doctor, day) || p >= samplePatients.length) continue;
      const date = dateKey(day);
      const time = slotTimes(doctor).find(
        (t) =>
          !isPrebooked(doctor.id, date, t, bookingRules.prebookedEvery) &&
          ![...existing, ...result].some((b) => b.doctorId === doctor.id && b.date === date && b.time === t),
      );
      if (!time) continue;
      const patient = samplePatients[p++];
      result.push({
        id: makeBookingId(date, bookingRules.idPrefix),
        doctorId: doctor.id,
        date,
        time,
        name: patient.name,
        phone: `98XXX XXX${String(10 + p).padStart(2, "0")}`,
        reason: patient.reason,
        status: "booked",
        createdAt: now.toISOString(),
        sample: true,
      });
    }
  }
  return result;
}
