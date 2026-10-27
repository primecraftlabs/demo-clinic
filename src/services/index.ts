// The ONE place that wires interfaces to adapters. Swap Firebase for another backend here, nowhere else.
// Firebase is loaded on demand, so pages that don't need it never download it.
import { notifications } from "@/config/clinic";
import { isFirebaseConfigured } from "@/config/firebase";
import { formspreeNotifier, silentNotifier } from "./formspree-notifier";
import { sampleBookingStore } from "./sample/booking-store";
import { sampleDoctorStore } from "./sample/doctor-store";
import { sampleSettingsStore } from "./sample/settings-store";
import { sampleTeamAdmin } from "./sample/team-admin";
import type { BookingStore, DoctorStore, Notifier, SettingsStore, StaffAuth, TeamAdmin } from "./types";

export type * from "./types";
export { DoctorExistsError, InviteError, SignInError, SlotTakenError } from "./types";

/** False when the Firebase keys are missing (e.g. a fresh clone without .env.local): pages fall back gracefully. */
export const onlineBookingAvailable = isFirebaseConfigured;

/** Everything the live (signed-in or booking) parts of the site use. */
export type LiveServices = {
  bookings: BookingStore;
  doctors: DoctorStore;
  auth: StaffAuth;
  team: TeamAdmin;
  settings: SettingsStore;
};

let live: Promise<LiveServices> | null = null;

export function liveServices(): Promise<LiveServices> {
  live ??= (async () => {
    const [b, d, a, t, s] = await Promise.all([
      import("./firebase/booking-store"),
      import("./firebase/doctor-store"),
      import("./firebase/staff-auth"),
      import("./firebase/team-admin"),
      import("./firebase/settings-store"),
    ]);
    return {
      bookings: b.firebaseBookingStore(),
      doctors: d.firebaseDoctorStore(),
      auth: a.firebaseStaffAuth(),
      team: t.firebaseTeamAdmin(),
      settings: s.firebaseSettingsStore(),
    };
  })();
  return live;
}

// Lighter loaders for public pages (no login/admin code).
let publicDoctors: Promise<DoctorStore> | null = null;
let publicBookings: Promise<BookingStore> | null = null;
let publicSettings: Promise<SettingsStore> | null = null;

/** Clinic settings (holidays) for the public pages. */
export function settingsStore(): Promise<SettingsStore> {
  publicSettings ??= isFirebaseConfigured
    ? import("./firebase/settings-store").then((m) => m.firebaseSettingsStore())
    : Promise.resolve(sampleSettingsStore());
  return publicSettings;
}

/** Doctors for the public pages (starter doctors when Firebase isn't set up). */
export function doctorStore(): Promise<DoctorStore> {
  publicDoctors ??= isFirebaseConfigured
    ? import("./firebase/doctor-store").then((m) => m.firebaseDoctorStore())
    : Promise.resolve(sampleDoctorStore());
  return publicDoctors;
}

/** Bookings for the public booking page. */
export function bookingStore(): Promise<BookingStore> {
  publicBookings ??= import("./firebase/booking-store").then((m) => m.firebaseBookingStore());
  return publicBookings;
}

/** In-memory stand-ins for the dashboard preview (sample patients, nothing saved). */
export function previewServices(now: Date) {
  return {
    bookings: sampleBookingStore(now),
    doctors: sampleDoctorStore(),
    team: sampleTeamAdmin(),
    settings: sampleSettingsStore(),
  };
}

export const notifier: Notifier = notifications.enabled
  ? formspreeNotifier(notifications.endpoint, notifications.subject)
  : silentNotifier;
