// Doctor profile rules (pure). firestore.rules enforces the same fields and limits.
import type { Doctor } from "./booking";

/** Fields a doctor may change on their own profile. Everything else (schedule, published, order) is admin-only. */
export const DOCTOR_EDITABLE = ["name", "initials", "speciality", "about", "experience", "languages", "leave", "avatar"] as const;
export type DoctorProfile = Pick<Doctor, (typeof DOCTOR_EDITABLE)[number]>;
export type DoctorSchedule = Pick<Doctor, "days" | "start" | "end" | "slotMinutes">;

export const doctorLimits = {
  nameMin: 3,
  nameMax: 60,
  specialityMax: 60,
  aboutMax: 400,
  experienceMax: 60,
  languagesMax: 6,
  leaveMax: 60,
  slotLengths: [10, 15, 20, 30, 45, 60],
  avatarPattern: /^[a-z0-9-]{0,60}$/,
} as const;

/** URL-safe id from a name, e.g. "Dr. Ananya Mehra" -> "ananya-mehra". */
export function doctorIdFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^dr\.?\s+/, "")
    .replace(/[^a-z\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 40)
    .replace(/-$/, "");
}

export function initialsOf(name: string): string {
  const words = name.trim().replace(/^dr\.?\s+/i, "").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[words.length - 1][0] : (words[0] ?? "").slice(0, 2)).toUpperCase();
}

export type ProfileErrors = Partial<Record<"name" | "speciality" | "about" | "experience" | "languages" | "leave", string>>;

export function validateProfile(p: DoctorProfile): ProfileErrors {
  const e: ProfileErrors = {};
  const L = doctorLimits;
  if (p.name.trim().length < L.nameMin || p.name.length > L.nameMax) e.name = `Name must be ${L.nameMin}-${L.nameMax} characters.`;
  if (!p.speciality.trim() || p.speciality.length > L.specialityMax) e.speciality = "Please enter a speciality.";
  if (p.about.length > L.aboutMax) e.about = `Please keep this under ${L.aboutMax} characters.`;
  if (!Number.isInteger(p.experience) || p.experience < 0 || p.experience > L.experienceMax) e.experience = "Enter years of experience (0-60).";
  if (p.languages.length > L.languagesMax) e.languages = `Up to ${L.languagesMax} languages.`;
  if (p.leave.length > L.leaveMax) e.leave = `Up to ${L.leaveMax} leave days.`;
  return e;
}

export type ScheduleErrors = Partial<Record<"days" | "hours" | "slotMinutes", string>>;

export function validateSchedule(s: DoctorSchedule): ScheduleErrors {
  const e: ScheduleErrors = {};
  if (s.days.length === 0) e.days = "Choose at least one working day.";
  if (!/^\d{2}:\d{2}$/.test(s.start) || !/^\d{2}:\d{2}$/.test(s.end) || s.start >= s.end) e.hours = "End time must be after start time.";
  if (!(doctorLimits.slotLengths as readonly number[]).includes(s.slotMinutes)) e.slotMinutes = "Choose an appointment length.";
  return e;
}

/** Leave days kept sorted, unique and from `today` on (old ones drop off automatically). */
export function cleanLeave(leave: readonly string[], today: string): string[] {
  return [...new Set(leave)].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today).sort();
}

/** "Hindi, English" <-> ["Hindi", "English"] */
export function parseLanguages(text: string): string[] {
  return [...new Set(text.split(",").map((l) => l.trim()).filter(Boolean))].slice(0, doctorLimits.languagesMax);
}

/** A complete doctor document for a newly invited doctor (hidden until the admin publishes it). */
export function newDoctor(name: string, speciality: string, order: number): Doctor {
  return {
    id: doctorIdFromName(name),
    name: name.trim(),
    initials: initialsOf(name),
    speciality: speciality.trim(),
    experience: 0,
    days: [1, 2, 3, 4, 5],
    start: "10:00",
    end: "13:00",
    slotMinutes: 20,
    about: "",
    languages: [],
    leave: [],
    avatar: doctorIdFromName(name), // every new doctor starts with their own avatar; they can pick another
    active: false,
    order,
  };
}

export function sortDoctors(doctors: readonly Doctor[]): Doctor[] {
  return [...doctors].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
