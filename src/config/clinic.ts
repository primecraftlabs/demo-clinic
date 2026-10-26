// Everything about the clinic lives here: details, booking rules, notifications, page text.
// Doctors are in src/data/doctors.ts, photos in ./photos.json, Firebase keys in ./firebase.ts (from .env).
// Kinara Family Clinic is a concept clinic: bookings reach the studio, clearly labelled (see `concept`).
import type { BookingRules } from "@/lib/booking";
import type { IconName } from "@/components/Icons";
import brand from "./brand.json";
import { studio } from "./studio";

const area = "Lajpat Nagar, New Delhi";

export const clinic = {
  name: "Kinara Family Clinic",
  shortName: "Kinara",
  subtitle: "Family Clinic",
  tagline: "Caring, unhurried consultations for the whole family.",
  area,
  areaNote: "Close to the metro station and main market.",
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(area)}`,
  hours: [
    { days: "Monday – Saturday", time: "10:00 AM – 8:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],
  arrivalNote: "Please arrive 10 minutes early and bring any previous reports.",
  /** Booking dates/times are the clinic's local time. */
  timeZone: "Asia/Kolkata",
  /** WhatsApp chat for patients. On a client site: the clinic's own wa.me link. */
  whatsappUrl: studio.whatsappChatUrl,
};

export const bookingRules: BookingRules = {
  daysAhead: 7,
  codePrefix: "KFC",
  maxNameLength: 60,
  maxReasonLength: 200,
};

/** Staff dashboard deletes bookings this many days after the visit date (keeps patient data short-lived). */
export const retentionDays = 30;

/** Honest labelling for the concept site. On a client site set every text to "". */
export const concept = {
  footer: `Concept website designed and built by ${studio.name}. ${clinic.name} is a concept clinic.`,
  bookingNotice: `${clinic.name} is a concept clinic by ${studio.name}. Your booking reaches the studio, not a real clinic, so please use test details and no medical information.`,
  whatsappPrefix: "Concept clinic booking:",
};

/** New-booking email to the clinic (via the studio's Formspree form). Set enabled: false to switch off. */
export const notifications = {
  enabled: true,
  endpoint: `https://formspree.io/f/${brand.formspreeId}`,
  subject: `New booking - ${clinic.name} (concept site)`,
};

export const calendar = {
  googleUrl: "https://calendar.google.com/calendar/render",
};

export const services: { title: string; text: string; icon: IconName }[] = [
  { title: "General consultation", text: "Same-week appointments for everyday health concerns and follow-ups.", icon: "stethoscope" },
  { title: "Child care", text: "Friendly check-ups for babies and children, with vaccination schedules.", icon: "child" },
  { title: "Skin & hair", text: "Consultations for skin, hair and nail concerns.", icon: "sparkle" },
  { title: "Dental care", text: "Check-ups, cleaning and treatment planning.", icon: "tooth" },
  { title: "Health check-ups", text: "Routine check-up packages for adults and seniors.", icon: "heart" },
  { title: "Vaccinations", text: "Scheduled vaccinations for children and adults.", icon: "shield" },
];

export const reasons = [
  { title: "Book in 30 seconds", text: "Pick a doctor, a day and a time. No phone calls, no waiting on hold." },
  { title: "Real availability", text: "Booked times disappear instantly for everyone, so two patients never get the same slot." },
  { title: "Instant confirmation", text: "Your booking code on screen, one tap to add it to your calendar." },
  { title: "Experienced doctors", text: "A small team that knows your family's history and follows up." },
];

export const howItWorks = [
  { title: "Choose a doctor", text: "See each doctor's speciality and consultation days." },
  { title: "Pick a free time", text: "Only open slots are shown, live." },
  { title: "Get your booking code", text: "Add it to your calendar or message us on WhatsApp." },
];

export const about = {
  eyebrow: "Our approach",
  title: "Unhurried care, the way a family doctor should be",
  paragraphs: [
    "We keep appointments on time and consultations unrushed, so there's room for questions. Booking online means you know exactly when to come in, with no waiting room crowds.",
    "Our doctors look after the whole family, from a child's first vaccinations to a grandparent's routine check-up, and they keep notes so every visit picks up where the last one left off.",
  ],
  points: [
    { icon: "clock" as IconName, text: "Appointments that start on time" },
    { icon: "heart" as IconName, text: "Care for every age, in one place" },
    { icon: "shield" as IconName, text: "Your details seen only by clinic staff" },
  ],
};

export const faqs = [
  { q: "Is online booking free?", a: "Yes. Booking online costs nothing; you only pay for your consultation at the clinic." },
  { q: "How far ahead can I book?", a: `Up to ${bookingRules.daysAhead} days ahead, including today. Each doctor's free times are shown live.` },
  { q: "Can I book for my child or a parent?", a: "Yes. Enter the patient's name and your mobile number so we can reach you." },
  { q: "How do I cancel or change my appointment?", a: "Message us on WhatsApp with your booking code. We'll free the time so someone else can use it, and help you pick a new one." },
  { q: "What should I bring?", a: clinic.arrivalNote },
];

/** Photo banners for inner pages (slots in photos.json). */
export const pageBanners = { doctors: "doctors-banner", book: "book-banner" } as const;

/** "Inside the clinic" gallery: photo slots from photos.json. Keep 5 (big first tile + 4) so the grid has no gaps. */
export const gallery = [
  { slot: "consult", label: "Consultation room" },
  { slot: "waiting", label: "Waiting area" },
  { slot: "dental", label: "Dental care" },
  { slot: "kids", label: "Child-friendly care" },
  { slot: "equipment", label: "Modern equipment" },
];

/** Names for photo slots that aren't gallery tiles (credits page). */
export const photoLabels: Record<string, string> = {
  hero: "Home page banner",
  about: "Our approach",
  visit: "Visit us section",
  "doctors-banner": "Doctors page banner",
  "book-banner": "Booking page banner",
};
