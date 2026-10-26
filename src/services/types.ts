// The contracts the UI depends on. Adapters (firebase/, sample/, formspree) implement them;
// src/services/index.ts is the ONE place that decides which adapter is used.
import type { Booking, BookingStatus, Doctor } from "@/lib/booking";
import type { BookingDraft } from "@/lib/records";

export interface BookingStore {
  /** Start times already taken for one doctor on one date. */
  takenTimes(doctorId: string, date: string): Promise<string[]>;
  /** Saves a booking. Rejects with SlotTakenError if someone else got the slot first. */
  create(draft: BookingDraft, code: string): Promise<Booking>;
  /** Staff: live list of all bookings. Returns a function that stops listening. */
  watch(onChange: (bookings: Booking[]) => void, onError: (error: Error) => void): () => void;
  /** Staff: completed / cancelled (cancelling frees the slot). */
  setStatus(booking: Booking, status: BookingStatus): Promise<void>;
  /** Staff: deletes bookings whose visit date is before `date`. Returns how many were removed. */
  removeBefore(date: string): Promise<number>;
}

export type StaffUser = { email: string; isStaff: boolean };

export interface StaffAuth {
  /** Calls back with the signed-in user (or null) now and on every change. Returns an unsubscribe function. */
  watch(onChange: (user: StaffUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export interface Notifier {
  bookingCreated(booking: Booking, doctor: Doctor): Promise<void>;
}

export class SlotTakenError extends Error {
  constructor() {
    super("This time was just booked by someone else.");
    this.name = "SlotTakenError";
  }
}

export class SignInError extends Error {
  constructor(message = "Email or password is not correct.") {
    super(message);
    this.name = "SignInError";
  }
}
