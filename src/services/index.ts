// The ONE place that wires interfaces to adapters. Swap Firebase for another backend here, nowhere else.
// Firebase is loaded on demand, so pages that don't book or show the dashboard never download it.
import { notifications } from "@/config/clinic";
import { isFirebaseConfigured } from "@/config/firebase";
import { formspreeNotifier, silentNotifier } from "./formspree-notifier";
import { sampleBookingStore } from "./sample/booking-store";
import type { BookingStore, Notifier, StaffAuth } from "./types";

export type { BookingStore, Notifier, StaffAuth, StaffUser } from "./types";
export { SignInError, SlotTakenError } from "./types";

/** False when the Firebase keys are missing (e.g. a fresh clone without .env.local): pages show a friendly notice. */
export const onlineBookingAvailable = isFirebaseConfigured;

export async function liveBookingStore(): Promise<BookingStore> {
  const { firebaseBookingStore } = await import("./firebase/booking-store");
  return firebaseBookingStore();
}

export async function liveStaffAuth(): Promise<StaffAuth> {
  const { firebaseStaffAuth } = await import("./firebase/staff-auth");
  return firebaseStaffAuth();
}

export const previewBookingStore = (now: Date): BookingStore => sampleBookingStore(now);

export const notifier: Notifier = notifications.enabled
  ? formspreeNotifier(notifications.endpoint, notifications.subject)
  : silentNotifier;
