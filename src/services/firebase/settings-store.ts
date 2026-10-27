// SettingsStore on Cloud Firestore: one document, settings/clinic (public read, admin write - see firestore.rules).
import { doc, getDoc, onSnapshot, setDoc, type DocumentData } from "firebase/firestore";
import { clinicSettingsId, collections } from "@/config/firebase";
import type { ClinicSettings, SettingsStore } from "../types";
import { db } from "./app";

const toSettings = (d: DocumentData | undefined): ClinicSettings => ({ holidays: d?.holidays ?? [] });

export function firebaseSettingsStore(): SettingsStore {
  const ref = doc(db(), collections.settings, clinicSettingsId);
  return {
    async get() {
      return toSettings((await getDoc(ref)).data());
    },
    watch(onChange, onError) {
      return onSnapshot(ref, (snap) => onChange(toSettings(snap.data())), onError);
    },
    async setHolidays(holidays) {
      await setDoc(ref, { holidays });
    },
  };
}
