// Fictional doctors. days: 0 = Sunday ... 6 = Saturday; times are 24h "HH:MM".
import type { Doctor } from "@/lib/booking";

export const doctors: Doctor[] = [
  {
    id: "ananya-mehra",
    name: "Dr. Ananya Mehra",
    initials: "AM",
    speciality: "General Physician",
    experience: 12,
    days: [1, 2, 3, 4, 5, 6],
    start: "10:00",
    end: "13:00",
    slotMinutes: 20,
    about: "Everyday illnesses, fevers, follow-ups and routine check-ups for the whole family.",
  },
  {
    id: "rohan-kapoor",
    name: "Dr. Rohan Kapoor",
    initials: "RK",
    speciality: "Paediatrician",
    experience: 9,
    days: [1, 3, 5, 6],
    start: "16:00",
    end: "19:00",
    slotMinutes: 20,
    about: "Care for babies and children, growth check-ups and vaccination schedules.",
  },
  {
    id: "sana-qureshi",
    name: "Dr. Sana Qureshi",
    initials: "SQ",
    speciality: "Dermatologist",
    experience: 7,
    days: [2, 4, 6],
    start: "11:00",
    end: "14:00",
    slotMinutes: 30,
    about: "Skin, hair and nail concerns, with clear explanations and follow-up plans.",
  },
  {
    id: "vikram-sethi",
    name: "Dr. Vikram Sethi",
    initials: "VS",
    speciality: "Dentist",
    experience: 10,
    days: [1, 2, 3, 4, 5],
    start: "17:00",
    end: "20:00",
    slotMinutes: 30,
    about: "Dental check-ups, cleaning and treatment planning in a calm, gentle setting.",
  },
];

export function getDoctor(id: string | null | undefined) {
  return doctors.find((d) => d.id === id);
}
