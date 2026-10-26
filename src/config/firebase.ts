// Firebase web app settings. Values come from .env.local locally and from GitHub Actions variables in CI
// (kept out of git because "AIza" keys trip the commit guard and GitHub secret scanning; they are not passwords -
// security comes from firestore.rules).

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

/** Firestore database name in the project (created in the console as "default"; Firebase's usual one is "(default)").
 *  Keep in step with "database" in firebase.json, which the rules deploy uses. */
export const databaseId = "default";

export const collections = { bookings: "bookings", slots: "slots", staff: "staff", doctors: "doctors" } as const;
