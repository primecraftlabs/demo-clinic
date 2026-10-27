// Today's queue (pure): patients who have arrived, in token order, then those still expected, by time.
import type { Booking } from "./booking";

export function queueOrder(bookings: readonly Booking[]): Booking[] {
  const rank = (b: Booking) => (b.status === "arrived" ? 0 : b.status === "booked" ? 1 : 2);
  return [...bookings].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? a.token - b.token : a.time.localeCompare(b.time)));
}

/** Counter document id for one doctor's queue on one date. */
export function queueId(doctorId: string, date: string): string {
  return `${doctorId}_${date}`;
}
