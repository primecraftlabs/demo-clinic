// BookingStore kept in memory with sample patients: the dashboard preview for visitors, no database involved.
import { bookingRules } from "@/config/clinic";
import { doctors } from "@/data/doctors";
import { samplePatients, samplePhone } from "@/data/samples";
import { type Booking, dateKey, makeBookingCode, nextDays, slotTimes, worksOn } from "@/lib/booking";
import type { BookingStore } from "../types";

function seed(now: Date): Booking[] {
  const result: Booking[] = [];
  let p = 0;
  for (const day of nextDays(now, 3)) {
    for (const doctor of doctors) {
      if (!worksOn(doctor, day) || p >= samplePatients.length) continue;
      const date = dateKey(day);
      const patient = samplePatients[p];
      const time = slotTimes(doctor)[p % slotTimes(doctor).length];
      result.push({
        id: `sample-${p}`,
        code: makeBookingCode(date, bookingRules.codePrefix),
        doctorId: doctor.id,
        date,
        time,
        name: patient.name,
        phone: samplePhone,
        reason: patient.reason,
        status: "booked",
      });
      p++;
    }
  }
  return result;
}

export function sampleBookingStore(now: Date): BookingStore {
  let bookings = seed(now);
  const listeners = new Set<(b: Booking[]) => void>();
  const emit = () => listeners.forEach((l) => l(bookings));

  return {
    async takenTimes(doctorId, date) {
      return bookings.filter((b) => b.doctorId === doctorId && b.date === date && b.status !== "cancelled").map((b) => b.time);
    },
    async create(draft, code) {
      const booking: Booking = { id: `sample-${bookings.length}`, code, ...draft, status: "booked" };
      bookings = [...bookings, booking];
      emit();
      return booking;
    },
    watch(onChange) {
      listeners.add(onChange);
      onChange(bookings);
      return () => listeners.delete(onChange);
    },
    async setStatus(booking, status) {
      bookings = bookings.map((b) => (b.id === booking.id ? { ...b, status } : b));
      emit();
    },
    async removeBefore(date) {
      const before = bookings.length;
      bookings = bookings.filter((b) => b.date >= date);
      emit();
      return before - bookings.length;
    },
  };
}

