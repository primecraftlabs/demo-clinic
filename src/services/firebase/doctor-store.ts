// DoctorStore on Cloud Firestore (doctors/{id}). Field rules live in firestore.rules.
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where, type DocumentData } from "firebase/firestore";
import { collections } from "@/config/firebase";
import type { Doctor } from "@/lib/booking";
import { sortDoctors } from "@/lib/doctors";
import { DoctorExistsError, type DoctorFields, type DoctorStore } from "../types";
import { db } from "./app";

function toDoctor(id: string, d: DocumentData): Doctor {
  return {
    id,
    name: d.name,
    initials: d.initials,
    speciality: d.speciality,
    experience: d.experience,
    days: d.days ?? [],
    start: d.start,
    end: d.end,
    slotMinutes: d.slotMinutes,
    about: d.about ?? "",
    languages: d.languages ?? [],
    leave: d.leave ?? [],
    avatar: d.avatar ?? "",
    active: d.active === true,
    order: d.order ?? 0,
  };
}

export function firebaseDoctorStore(): DoctorStore {
  const ref = collection(db(), collections.doctors);
  return {
    async listPublished() {
      const snap = await getDocs(query(ref, where("active", "==", true)));
      return sortDoctors(snap.docs.map((d) => toDoctor(d.id, d.data())));
    },
    watchAll(onChange, onError) {
      return onSnapshot(ref, (snap) => onChange(sortDoctors(snap.docs.map((d) => toDoctor(d.id, d.data())))), onError);
    },
    watchOne(id, onChange, onError) {
      return onSnapshot(doc(ref, id), (snap) => onChange(snap.exists() ? toDoctor(snap.id, snap.data()) : null), onError);
    },
    async create({ id, ...fields }: Doctor) {
      if ((await getDoc(doc(ref, id))).exists()) throw new DoctorExistsError();
      await setDoc(doc(ref, id), fields satisfies DoctorFields);
    },
    async update(id, patch) {
      await updateDoc(doc(ref, id), patch);
    },
  };
}
