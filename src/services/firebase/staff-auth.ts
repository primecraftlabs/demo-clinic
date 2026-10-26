// StaffAuth on Firebase Authentication (email + password). The role comes from staff/{uid}:
// "owner" (clinic admin, added in the Firebase console) or "doctor" (invited from the dashboard).
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { collections } from "@/config/firebase";
import { SignInError, type Role, type StaffAuth } from "../types";
import { auth, db } from "./app";

export function firebaseStaffAuth(): StaffAuth {
  const a = auth();
  return {
    watch(onChange) {
      return onAuthStateChanged(a, async (user) => {
        if (!user) return onChange(null);
        let role: Role | null = null;
        let doctorId: string | undefined;
        try {
          const snap = await getDoc(doc(db(), collections.staff, user.uid));
          if (snap.exists()) {
            role = snap.data().role === "owner" ? "owner" : snap.data().role === "doctor" ? "doctor" : null;
            doctorId = snap.data().doctorId;
          }
        } catch {
          role = null;
        }
        onChange({ uid: user.uid, email: user.email ?? "", role, doctorId });
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
    async sendPasswordReset(email) {
      await sendPasswordResetEmail(a, email.trim());
    },
  };
}
