// Shared Firebase app (created once, only in the browser, only when a page actually needs it).
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { databaseId, firebaseConfig } from "@/config/firebase";

export function firebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const db = () => getFirestore(firebaseApp(), databaseId);
export const auth = () => getAuth(firebaseApp());
