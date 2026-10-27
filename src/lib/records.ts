// The exact documents written to Firestore for one booking (pure: no Firebase imports, unit-testable).
// firestore.rules checks these same shapes, so the app and the rules can't drift apart.
import type { BookingSource } from "./booking";

/** Public "this slot is taken" marker: no personal data, readable by everyone. */
export type SlotRecord = { doctorId: string; date: string; time: string; bookingId: string };

/** The booking itself: readable only by clinic staff. `createdAt` is set by the server. */
export type BookingRecord = {
  code: string;
  slotId: string;
  doctorId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  reason: string;
  status: "booked";
  source: BookingSource;
  token: 0;
  /** The patient agreed to the privacy notice (staff confirm it for phone/walk-in bookings). */
  consent: true;
};

export type BookingDraft = { doctorId: string; date: string; time: string; name: string; phone: string; reason: string };

/** One document per doctor/date/time, e.g. "ananya-mehra_2026-10-27_1020". Creating it twice is impossible. */
export function slotId(doctorId: string, date: string, time: string): string {
  return `${doctorId}_${date}_${time.replace(":", "")}`;
}

export function bookingRecords(draft: BookingDraft, bookingId: string, code: string, source: BookingSource = "online") {
  const id = slotId(draft.doctorId, draft.date, draft.time);
  const slot: SlotRecord = { doctorId: draft.doctorId, date: draft.date, time: draft.time, bookingId };
  const booking: BookingRecord = {
    code,
    slotId: id,
    doctorId: draft.doctorId,
    date: draft.date,
    time: draft.time,
    name: draft.name.trim(),
    phone: draft.phone,
    reason: draft.reason.trim(),
    status: "booked",
    source,
    token: 0,
    consent: true,
  };
  return { slotId: id, slot, booking };
}
