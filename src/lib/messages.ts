// Text the patient sends the clinic on WhatsApp after booking (pure).
import { formatDate, formatTime, type Booking, type Doctor } from "./booking.ts"; // .ts so plain Node can run the unit tests

export function bookingWhatsappText(booking: Booking, doctor: Doctor, clinicName: string, prefix = ""): string {
  return [
    ...(prefix ? [prefix] : []),
    `Hi ${clinicName}, I booked an appointment online.`,
    `Booking: ${booking.code}`,
    `Doctor: ${doctor.name}`,
    `When: ${formatDate(booking.date)}, ${formatTime(booking.time)}`,
    `Patient: ${booking.name}`,
  ].join("\n");
}

/** Reminder the clinic sends a patient on WhatsApp (staff tap Send; no paid API). */
export function reminderText(booking: Booking, doctor: Doctor, clinicName: string, arrivalNote: string): string {
  return [
    `Hello ${booking.name}, this is a reminder from ${clinicName}.`,
    `Your appointment with ${doctor.name} is on ${formatDate(booking.date)} at ${formatTime(booking.time)}.`,
    `Booking: ${booking.code}`,
    arrivalNote,
    "Reply here if you need to change the time.",
  ].join("\n");
}

/** wa.me link that opens a chat with the patient, message typed in. `phone` is a 10-digit Indian mobile. */
export function whatsappToPatient(phone: string, countryCode: string, text: string): string {
  return `https://wa.me/${countryCode}${phone}?text=${encodeURIComponent(text)}`;
}
