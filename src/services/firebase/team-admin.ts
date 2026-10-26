// TeamAdmin on Firebase: creates a doctor's login without signing the admin out (a second, temporary Firebase
// app does the sign-up), records the role in staff/{uid}, and emails the doctor a "set your password" link.
import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { collections, firebaseConfig } from "@/config/firebase";
import { InviteError, type TeamAdmin } from "../types";
import { auth, db } from "./app";

/** Throwaway password; the doctor replaces it from the emailed link and never sees it. */
function randomPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("") + "!Aa1";
}

export function firebaseTeamAdmin(): TeamAdmin {
  const staff = collection(db(), collections.staff);
  return {
    async invite(email, doctorId) {
      const address = email.trim().toLowerCase();
      const helper = initializeApp(firebaseConfig, `invite-${Date.now()}`);
      try {
        const helperAuth = getAuth(helper);
        const { user } = await createUserWithEmailAndPassword(helperAuth, address, randomPassword());
        await signOut(helperAuth);
        await setDoc(doc(staff, user.uid), { role: "doctor", doctorId, email: address });
        await sendPasswordResetEmail(auth(), address);
      } catch (error) {
        const code = (error as { code?: string }).code ?? "";
        if (code === "auth/email-already-in-use") throw new InviteError("This email already has a login. Use a different email.");
        if (code === "auth/invalid-email") throw new InviteError("Please enter a valid email address.");
        throw new InviteError("Couldn't send the invite. Please try again.");
      } finally {
        await deleteApp(helper);
      }
    },
    watchMembers(onChange, onError) {
      return onSnapshot(
        query(staff, where("role", "==", "doctor")),
        (snap) => onChange(snap.docs.map((d) => ({ uid: d.id, email: d.data().email, doctorId: d.data().doctorId }))),
        onError,
      );
    },
    async revoke(uid) {
      await deleteDoc(doc(staff, uid));
    },
  };
}
