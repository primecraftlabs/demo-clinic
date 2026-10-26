// DoctorStore in memory, seeded with the starter doctors: the dashboard preview and sites without Firebase.
import { starterDoctors } from "@/data/doctors";
import type { Doctor } from "@/lib/booking";
import { sortDoctors } from "@/lib/doctors";
import { DoctorExistsError, type DoctorStore } from "../types";

export function sampleDoctorStore(seed: readonly Doctor[] = starterDoctors): DoctorStore {
  let doctors = sortDoctors(seed);
  const listeners = new Set<(d: Doctor[]) => void>();
  const emit = () => listeners.forEach((l) => l(doctors));

  return {
    async listPublished() {
      return doctors.filter((d) => d.active);
    },
    watchAll(onChange) {
      listeners.add(onChange);
      onChange(doctors);
      return () => listeners.delete(onChange);
    },
    watchOne(id, onChange) {
      const listener = (all: Doctor[]) => onChange(all.find((d) => d.id === id) ?? null);
      listeners.add(listener);
      listener(doctors);
      return () => listeners.delete(listener);
    },
    async create(doctor) {
      if (doctors.some((d) => d.id === doctor.id)) throw new DoctorExistsError();
      doctors = sortDoctors([...doctors, doctor]);
      emit();
    },
    async update(id, patch) {
      doctors = sortDoctors(doctors.map((d) => (d.id === id ? { ...d, ...patch } : d)));
      emit();
    },
  };
}
