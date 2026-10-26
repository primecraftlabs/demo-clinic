// Notifier that emails the clinic about each new booking through a Formspree form (free plan).
import { formatDate, formatTime, type Booking, type Doctor } from "@/lib/booking";
import type { Notifier } from "./types";

export function formspreeNotifier(endpoint: string, subject: string): Notifier {
  return {
    async bookingCreated(booking: Booking, doctor: Doctor) {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: subject,
          booking: booking.code,
          doctor: `${doctor.name} (${doctor.speciality})`,
          when: `${formatDate(booking.date)}, ${formatTime(booking.time)}`,
          patient: booking.name,
          phone: booking.phone,
          reason: booking.reason || "-",
        }),
      });
    },
  };
}

export const silentNotifier: Notifier = { bookingCreated: async () => {} };
