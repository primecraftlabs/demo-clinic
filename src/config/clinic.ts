// All content and rules for the FICTIONAL clinic live here (doctors are in src/data/doctors.ts).
// Never put a real-looking phone number or email in this file.
import type { BookingRules } from "@/lib/booking";

const area = "Lajpat Nagar, New Delhi";

export const clinic = {
  name: "Kinara Family Clinic",
  shortName: "Kinara",
  subtitle: "Family Clinic",
  tagline: "Caring, unhurried consultations for the whole family.",
  area,
  areaNote: "Close to the metro station and main market.",
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area)}`,
  phoneMasked: "+91 98XXX XXXXX",
  hours: [
    { days: "Monday – Saturday", time: "10:00 AM – 8:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],
  arrivalNote: "Please arrive 10 minutes early and bring any previous reports.",
};

export const bookingRules: BookingRules = {
  /** How many days ahead (including today) patients can book */
  daysAhead: 7,
  /** Roughly 1 in N slots shows as already booked by other patients, so the demo looks realistic */
  prebookedEvery: 4,
  /** Prefix of booking IDs, e.g. KFC-261027-AB3D */
  idPrefix: "KFC",
  maxReasonLength: 200,
};

/** Browser storage key for demo bookings */
export const storageKey = "kinara-demo-bookings";

export const services = [
  { title: "General consultation", text: "Same-week appointments for everyday health concerns and follow-ups.", icon: "stethoscope" },
  { title: "Child care", text: "Friendly check-ups for babies and children, with vaccination reminders.", icon: "child" },
  { title: "Skin & hair", text: "Consultations for skin, hair and nail concerns.", icon: "sparkle" },
  { title: "Dental care", text: "Check-ups, cleaning and treatment planning.", icon: "tooth" },
  { title: "Health check-ups", text: "Routine check-up packages for adults and seniors.", icon: "heart" },
  { title: "Vaccinations", text: "Scheduled vaccinations for children and adults.", icon: "shield" },
] as const;

export const reasons = [
  { title: "Book in 30 seconds", text: "Pick a doctor, a day and a time. No phone calls, no waiting on hold." },
  { title: "See real availability", text: "Only free slots are shown, so you never arrive to a full waiting room." },
  { title: "Confirmation on WhatsApp", text: "Get your booking details instantly, with a reminder before your visit." },
  { title: "Experienced doctors", text: "A small team that knows your family's history and follows up." },
];

export const demoStorageNote =
  "Demo mode: bookings are saved only in your browser. On a real clinic website they go to the clinic's dashboard and the patient gets a WhatsApp/email confirmation.";

/** Sample patients for the dashboard's "Load sample bookings" button (fictional, phones masked). */
export const samplePatients = [
  { name: "Riya S.", reason: "Fever since two days" },
  { name: "Aman K.", reason: "Routine check-up" },
  { name: "Meera J.", reason: "Child vaccination" },
  { name: "Kabir T.", reason: "Skin rash follow-up" },
  { name: "Neha P.", reason: "Tooth sensitivity" },
  { name: "Arjun M.", reason: "Follow-up visit" },
];
