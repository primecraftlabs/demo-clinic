// Text the patient sends the clinic on WhatsApp after booking (pure).
import { formatDate, formatTime, type Booking, type Doctor } from "./booking";

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
