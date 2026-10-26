// The contracts the UI depends on. Adapters (firebase/, sample/, formspree) implement them;
// src/services/index.ts is the ONE place that decides which adapter is used.
import type { Booking, BookingStatus, Doctor } from "@/lib/booking";
import type { BookingDraft } from "@/lib/records";

export type Unsubscribe = () => void;
export type OnError = (error: Error) => void;

/** Whose bookings to show: everything (admin) or one doctor's. */
export type BookingScope = { doctorId?: string };

export interface BookingStore {
  /** Start times already taken for one doctor on one date. */
  takenTimes(doctorId: string, date: string): Promise<string[]>;
  /** Saves a booking. Rejects with SlotTakenError if someone else got the slot first. */
  create(draft: BookingDraft, code: string): Promise<Booking>;
  /** Staff: live list of bookings in scope. */
  watch(scope: BookingScope, onChange: (bookings: Booking[]) => void, onError: OnError): Unsubscribe;
  /** Staff: completed / cancelled (cancelling frees the slot). */
  setStatus(booking: Booking, status: BookingStatus): Promise<void>;
  /** Admin: deletes bookings whose visit date is before `date`. Returns how many were removed. */
  removeBefore(date: string): Promise<number>;
}

/** Fields stored for a doctor (the id is the document key). */
export type DoctorFields = Omit<Doctor, "id">;

export interface DoctorStore {
  /** Doctors patients can see and book. */
  listPublished(): Promise<Doctor[]>;
  /** Admin: every doctor, live. */
  watchAll(onChange: (doctors: Doctor[]) => void, onError: OnError): Unsubscribe;
  /** One doctor, live (a doctor's own profile). */
  watchOne(id: string, onChange: (doctor: Doctor | null) => void, onError: OnError): Unsubscribe;
  /** Admin: adds a doctor. Rejects with DoctorExistsError if the id is taken. */
  create(doctor: Doctor): Promise<void>;
  /** Admin: any field. Doctor: only their profile fields (enforced by the rules). */
  update(id: string, patch: Partial<DoctorFields>): Promise<void>;
}

export type Role = "owner" | "doctor";
export type StaffUser = { uid: string; email: string; role: Role | null; doctorId?: string };

export interface StaffAuth {
  /** Calls back with the signed-in user (or null) now and on every change. */
  watch(onChange: (user: StaffUser | null) => void): Unsubscribe;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Emails a link to set a new password. */
  sendPasswordReset(email: string): Promise<void>;
}

export type TeamMember = { uid: string; email: string; doctorId: string };

/** Admin: who can sign in as which doctor. */
export interface TeamAdmin {
  /** Creates the doctor's login and emails them a link to set their own password. */
  invite(email: string, doctorId: string): Promise<void>;
  watchMembers(onChange: (members: TeamMember[]) => void, onError: OnError): Unsubscribe;
  /** Removes dashboard access (the doctor profile stays; hide it separately). */
  revoke(uid: string): Promise<void>;
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

export class InviteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InviteError";
  }
}

export class DoctorExistsError extends Error {
  constructor() {
    super("A doctor with this name already exists.");
    this.name = "DoctorExistsError";
  }
}
