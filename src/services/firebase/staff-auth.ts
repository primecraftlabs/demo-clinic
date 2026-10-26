// StaffAuth on Firebase Authentication (email + password). A user is staff only if staff/{uid} exists,
// which the owner adds in the Firebase console (see PROJECT.md).
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { collections } from "@/config/firebase";
import { SignInError, type StaffAuth } from "../types";
import { auth, db } from "./app";

export function firebaseStaffAuth(): StaffAuth {
  const a = auth();
  return {
    watch(onChange) {
      return onAuthStateChanged(a, async (user) => {
        if (!user) return onChange(null);
        let isStaff = false;
        try {
          isStaff = (await getDoc(doc(db(), collections.staff, user.uid))).exists();
        } catch {
          isStaff = false;
        }
        onChange({ email: user.email ?? "", isStaff });
      });
    },
    async signIn(email, password) {
      try {
        await signInWithEmailAndPassword(a, email.trim(), password);
      } catch (error) {
        const code = (error as { code?: string }).code ?? "";
        if (code === "auth/too-many-requests") throw new SignInError("Too many attempts. Please wait a few minutes and try again.");
        if (code === "auth/network-request-failed") throw new SignInError("No internet connection. Please try again.");
        throw new SignInError();
      }
    },
    signOut: () => signOut(a),
  };
}
