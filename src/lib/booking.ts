// Pure booking logic (no imports, no browser or Firebase APIs) so it can be unit-tested with plain Node.

export type Doctor = {
  id: string;
  name: string;
  initials: string;
  speciality: string;
  experience: number;
  /** Days of the week the doctor sees patients, 0 = Sunday ... 6 = Saturday */
  days: number[];
  /** Consultation hours, 24h "HH:MM" */
  start: string;
  end: string;
  slotMinutes: number;
  about: string;
};

export type BookingStatus = "booked" | "completed" | "cancelled";

/** A booking as the app sees it (whatever store it came from). */
export type Booking = {
  id: string;
  code: string;
  doctorId: string;
  date: string; // YYYY-MM-DD (clinic local time)
  time: string; // HH:MM
  name: string;
  phone: string;
  reason: string;
  status: BookingStatus;
};

export type SlotState = "free" | "taken" | "past";

export type BookingRules = {
  /** How many days ahead (including today) patients can book */
  daysAhead: number;
  /** Prefix of booking codes, e.g. KFC-261027-AB3D */
  codePrefix: string;
  maxNameLength: number;
  maxReasonLength: number;
};

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** The next `count` calendar days starting today. */
export function nextDays(from: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + i));
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

export function worksOn(doctor: Doctor, day: Date): boolean {
  return doctor.days.includes(day.getDay());
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** All consultation start times for a doctor on a working day. */
export function slotTimes(doctor: Doctor): string[] {
  const times: string[] = [];
  for (let t = toMinutes(doctor.start); t + doctor.slotMinutes <= toMinutes(doctor.end); t += doctor.slotMinutes) {
    times.push(fromMinutes(t));
  }
  return times;
}

/** `taken` = start times already booked for this doctor on this date. */
export function slotState(date: string, time: string, taken: readonly string[], now: Date): SlotState {
  const day = parseDateKey(date);
  const [h, m] = time.split(":").map(Number);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
  if (start.getTime() <= now.getTime()) return "past";
  return taken.includes(time) ? "taken" : "free";
}

export function availableSlots(doctor: Doctor, date: string, taken: readonly string[], now: Date) {
  if (!worksOn(doctor, parseDateKey(date))) return [];
  return slotTimes(doctor).map((time) => ({ time, state: slotState(date, time, taken, now) }));
}

/** 10-digit Indian mobile number, accepting spaces, dashes and a +91 / 0 prefix. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s-]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export type BookingInput = {
  doctor: Doctor | undefined;
  date: string;
  time: string;
  name: string;
  phone: string;
  reason: string;
};

export type BookingErrors = Partial<Record<"doctor" | "date" | "time" | "name" | "phone" | "reason", string>>;

export function validateBooking(input: BookingInput, taken: readonly string[], now: Date, rules: BookingRules): BookingErrors {
  const errors: BookingErrors = {};
  const { doctor, date, time } = input;
  if (!doctor) errors.doctor = "Please choose a doctor.";
  if (!date) errors.date = "Please choose a date.";
  else {
    const allowed = nextDays(now, rules.daysAhead).map(dateKey);
    if (!allowed.includes(date)) errors.date = `Please choose a date within the next ${rules.daysAhead} days.`;
    else if (doctor && !worksOn(doctor, parseDateKey(date))) errors.date = `${doctor.name} is not available on this day.`;
  }
  if (!time) errors.time = "Please choose a time slot.";
  else if (doctor && date && !errors.date && slotState(date, time, taken, now) !== "free") {
    errors.time = "This time slot is no longer available. Please choose another.";
  }
  const name = input.name.trim();
  if (name.length < 2) errors.name = "Please enter the patient's full name.";
  else if (name.length > rules.maxNameLength) errors.name = "Name is too long.";
  if (!normalizePhone(input.phone)) errors.phone = "Please enter a valid 10-digit mobile number.";
  if (input.reason.trim().length > rules.maxReasonLength) {
    errors.reason = `Please keep the reason under ${rules.maxReasonLength} characters.`;
  }
  return errors;
}

/** Short code the patient can quote, e.g. KFC-261027-AB3D (no 0/O/1/I to avoid mix-ups). */
export function makeBookingCode(date: string, prefix: string, random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const suffix = Array.from({ length: 4 }, () => alphabet[Math.floor(random() * alphabet.length)]).join("");
  return `${prefix}-${date.replaceAll("-", "").slice(2)}-${suffix}`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDate(date: string, style: "short" | "long" = "long"): string {
  return parseDateKey(date).toLocaleDateString("en-IN", {
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
  });
}

export function sortBookings(bookings: readonly Booking[]): Booking[] {
  return [...bookings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
