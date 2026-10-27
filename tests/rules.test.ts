// Firestore security rules tests. Run with: npm run test:rules  (starts the local Firestore emulator; needs Java)
import { after, before, beforeEach, describe, test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Doctor } from "../src/lib/booking.ts";
import { starterDoctors } from "../src/data/doctors.ts";
import type { BookingSource } from "../src/lib/booking.ts";
import { bookingRecords, type BookingDraft } from "../src/lib/records.ts";

let env: RulesTestEnvironment;

const [ananya, rohan] = starterDoctors;
const doctorData = (d: Doctor) => Object.fromEntries(Object.entries(d).filter(([key]) => key !== "id"));

const draft: BookingDraft = { doctorId: ananya.id, date: "2030-01-07", time: "10:20", name: "Test Patient", phone: "9876543210", reason: "Fever" };

function book(
  db: Firestore,
  d: BookingDraft = draft,
  bookingId = "b1",
  code = "KFC-300107-AB3D",
  extra: object = {},
  source: BookingSource = "online",
) {
  const { slotId, slot, booking } = bookingRecords(d, bookingId, code, source);
  const batch = writeBatch(db);
  batch.set(doc(db, "bookings", bookingId), { ...booking, createdAt: serverTimestamp(), ...extra });
  batch.set(doc(db, "slots", slotId), slot);
  return batch.commit();
}

const fs = (ctx: { firestore(): unknown }) => ctx.firestore() as Firestore;
const patient = () => fs(env.unauthenticatedContext());
const stranger = () => fs(env.authenticatedContext("someone"));
const owner = () => fs(env.authenticatedContext("owner-1"));
const drAnanya = () => fs(env.authenticatedContext("doc-ananya"));
const drRohan = () => fs(env.authenticatedContext("doc-rohan"));

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-kinara",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = fs(ctx);
    await setDoc(doc(db, "staff/owner-1"), { role: "owner" });
    await setDoc(doc(db, "staff/doc-ananya"), { role: "doctor", doctorId: ananya.id, email: "a@example.com" });
    await setDoc(doc(db, "staff/doc-rohan"), { role: "doctor", doctorId: rohan.id, email: "r@example.com" });
    await setDoc(doc(db, "doctors", ananya.id), doctorData({ ...ananya, leave: ["2030-01-08"] }));
    await setDoc(doc(db, "doctors", rohan.id), doctorData(rohan));
    await setDoc(doc(db, "doctors", "hidden-doc"), doctorData({ ...ananya, id: "hidden-doc", active: false }));
  });
});

after(() => env.cleanup());

describe("bookings", () => {
  test("a patient can book a free slot, and everyone can see that the slot is taken", async () => {
    await assertSucceeds(book(patient()));
    await assertSucceeds(getDocs(query(collection(patient(), "slots"), where("doctorId", "==", draft.doctorId), where("date", "==", draft.date))));
  });

  test("the same slot can't be booked twice", async () => {
    await assertSucceeds(book(patient()));
    await assertFails(book(patient(), draft, "b2", "KFC-300107-ZZZZ"));
  });

  test("a slot can't be blocked without a booking, and a booking can't skip its slot", async () => {
    const { slotId, slot, booking } = bookingRecords(draft, "b1", "KFC-300107-AB3D");
    await assertFails(setDoc(doc(patient(), "slots", slotId), slot));
    await assertFails(setDoc(doc(patient(), "bookings", "b1"), { ...booking, createdAt: serverTimestamp() }));
  });

  test("bad or extra booking data is refused", async () => {
    await assertFails(book(patient(), { ...draft, phone: "12345" }));
    await assertFails(book(patient(), { ...draft, name: "A" }));
    await assertFails(book(patient(), { ...draft, reason: "x".repeat(201) }));
    await assertFails(book(patient(), draft, "b1", "KFC-300107-AB3D", { status: "completed" }));
    await assertFails(book(patient(), draft, "b1", "KFC-300107-AB3D", { isAdmin: true }));
  });

  test("hidden doctors and leave days can't be booked", async () => {
    await assertFails(book(patient(), { ...draft, doctorId: "hidden-doc" }));
    await assertFails(book(patient(), { ...draft, date: "2030-01-08" }));
  });

  test("the admin sees every booking, a doctor only their own", async () => {
    await book(patient());
    await assertFails(getDoc(doc(patient(), "bookings", "b1")));
    await assertFails(getDoc(doc(stranger(), "bookings", "b1")));
    await assertSucceeds(getDocs(collection(owner(), "bookings")));
    await assertSucceeds(getDoc(doc(drAnanya(), "bookings", "b1")));
    await assertSucceeds(getDocs(query(collection(drAnanya(), "bookings"), where("doctorId", "==", ananya.id))));
    await assertFails(getDocs(collection(drAnanya(), "bookings")));
    await assertFails(getDoc(doc(drRohan(), "bookings", "b1")));
  });

  test("status changes: admin and that booking's doctor only, and only the status", async () => {
    await book(patient());
    await assertSucceeds(updateDoc(doc(drAnanya(), "bookings", "b1"), { status: "completed" }));
    await assertSucceeds(updateDoc(doc(owner(), "bookings", "b1"), { status: "booked" }));
    await assertFails(updateDoc(doc(drRohan(), "bookings", "b1"), { status: "cancelled" }));
    await assertFails(updateDoc(doc(owner(), "bookings", "b1"), { name: "Someone else" }));
    await assertFails(updateDoc(doc(owner(), "bookings", "b1"), { status: "deleted" }));
  });

  test("after a cancel frees the slot, it can be booked again", async () => {
    await book(patient());
    const { slotId } = bookingRecords(draft, "b1", "KFC-300107-AB3D");
    await assertFails(deleteDoc(doc(stranger(), "slots", slotId)));
    await assertFails(deleteDoc(doc(drRohan(), "slots", slotId)));
    await assertSucceeds(updateDoc(doc(drAnanya(), "bookings", "b1"), { status: "cancelled" }));
    await assertSucceeds(deleteDoc(doc(drAnanya(), "slots", slotId)));
    await assertSucceeds(book(patient(), draft, "b2", "KFC-300107-ZZZZ"));
  });
});

describe("doctors", () => {
  test("everyone sees published doctors; hidden ones only the admin and that doctor", async () => {
    await assertSucceeds(getDocs(query(collection(patient(), "doctors"), where("active", "==", true))));
    await assertFails(getDocs(collection(patient(), "doctors")));
    await assertFails(getDoc(doc(patient(), "doctors", "hidden-doc")));
    await assertSucceeds(getDoc(doc(owner(), "doctors", "hidden-doc")));
  });

  test("only the admin adds doctors, with complete valid data", async () => {
    const data = doctorData({ ...rohan, id: "new-doc", active: false });
    await assertFails(setDoc(doc(drAnanya(), "doctors", "new-doc"), data));
    await assertFails(setDoc(doc(stranger(), "doctors", "new-doc"), data));
    await assertFails(setDoc(doc(owner(), "doctors", "new-doc"), { ...data, experience: "ten" }));
    await assertFails(setDoc(doc(owner(), "doctors", "Bad_Id"), data));
    await assertSucceeds(setDoc(doc(owner(), "doctors", "new-doc"), data));
  });

  test("a doctor edits their own profile, leave days and avatar, but not schedule or publishing", async () => {
    const ref = doc(drAnanya(), "doctors", ananya.id);
    await assertSucceeds(updateDoc(ref, { about: "Updated", leave: ["2030-02-01"], avatar: "ananya-mehra-2-5", languages: ["Hindi"] }));
    await assertFails(updateDoc(ref, { days: [0] }));
    await assertFails(updateDoc(ref, { active: false }));
    await assertFails(updateDoc(ref, { order: 99 }));
    await assertFails(updateDoc(ref, { avatar: "<script>" }));
    await assertFails(updateDoc(doc(drAnanya(), "doctors", rohan.id), { about: "Not mine" }));
    await assertSucceeds(updateDoc(doc(owner(), "doctors", ananya.id), { days: [1, 2], slotMinutes: 30, active: false }));
  });
});

describe("staff", () => {
  test("the admin can give a doctor a login, but never make another owner", async () => {
    await assertSucceeds(setDoc(doc(owner(), "staff/new-uid"), { role: "doctor", doctorId: rohan.id, email: "n@example.com" }));
    await assertFails(setDoc(doc(owner(), "staff/other-uid"), { role: "owner", doctorId: rohan.id, email: "o@example.com" }));
    await assertFails(setDoc(doc(owner(), "staff/ghost-uid"), { role: "doctor", doctorId: "no-such-doctor", email: "g@example.com" }));
  });

  test("nobody else can create staff, and staff entries are private", async () => {
    await assertFails(setDoc(doc(stranger(), "staff/someone"), { role: "owner" }));
    await assertFails(setDoc(doc(drAnanya(), "staff/someone"), { role: "doctor", doctorId: ananya.id, email: "x@example.com" }));
    await assertSucceeds(getDoc(doc(drAnanya(), "staff/doc-ananya")));
    await assertFails(getDoc(doc(drAnanya(), "staff/doc-rohan")));
    await assertSucceeds(getDocs(collection(owner(), "staff")));
    await assertFails(deleteDoc(doc(owner(), "staff/owner-1")));
    await assertSucceeds(deleteDoc(doc(owner(), "staff/doc-rohan")));
  });
});

describe("consent, clinic holidays and staff bookings", () => {
  test("every booking needs the patient's consent", async () => {
    await assertFails(book(patient(), draft, "b1", "KFC-300107-AB3D", { consent: false }));
  });

  test("clinic holidays: everyone can read them, only the admin sets them, patients can't book them", async () => {
    await assertFails(setDoc(doc(drAnanya(), "settings/clinic"), { holidays: ["2030-01-07"] }));
    await assertSucceeds(setDoc(doc(owner(), "settings/clinic"), { holidays: ["2030-01-07"] }));
    await assertSucceeds(getDoc(doc(patient(), "settings/clinic")));
    await assertFails(book(patient()));
    await assertSucceeds(book(owner(), draft, "b2", "KFC-300107-PHON", {}, "phone")); // staff can still book a patient in
  });

  test("staff add phone and walk-in bookings; patients and other doctors can't pretend to", async () => {
    await assertFails(book(patient(), draft, "b1", "KFC-300107-AB3D", {}, "phone"));
    await assertFails(book(stranger(), draft, "b1", "KFC-300107-AB3D", {}, "walkin"));
    await assertFails(book(drRohan(), draft, "b1", "KFC-300107-AB3D", {}, "walkin"));
    await assertSucceeds(book(drAnanya(), draft, "b1", "KFC-300107-AB3D", {}, "walkin"));
    await assertFails(book(owner(), draft, "b2", "KFC-300107-ZZZZ", {}, "phone")); // still no double booking
    await assertSucceeds(book(owner(), { ...draft, time: "10:40" }, "b3", "KFC-300107-ZZZY", {}, "phone"));
  });

  test("staff can book on a doctor's leave day, patients can't", async () => {
    await assertFails(book(patient(), { ...draft, date: "2030-01-08" }));
    await assertSucceeds(book(owner(), { ...draft, date: "2030-01-08" }, "b2", "KFC-300108-PHON", {}, "phone"));
  });
});

describe("check-in and token queue", () => {
  test("staff check a patient in with a token; tokens can't be negative", async () => {
    await book(patient());
    await assertSucceeds(updateDoc(doc(drAnanya(), "bookings", "b1"), { status: "arrived", token: 3 }));
    await assertSucceeds(updateDoc(doc(owner(), "bookings", "b1"), { status: "noshow" }));
    await assertFails(updateDoc(doc(owner(), "bookings", "b1"), { token: -1 }));
    await assertFails(updateDoc(doc(drRohan(), "bookings", "b1"), { status: "arrived", token: 1 }));
  });

  test("the day's token counter belongs to that doctor's staff", async () => {
    const q = { doctorId: ananya.id, date: "2030-01-07", next: 2 };
    await assertSucceeds(setDoc(doc(drAnanya(), "queues", `${ananya.id}_2030-01-07`), q));
    await assertSucceeds(getDoc(doc(drAnanya(), "queues", `${ananya.id}_2030-01-07`)));
    await assertFails(getDoc(doc(drRohan(), "queues", `${ananya.id}_2030-01-07`)));
    await assertFails(setDoc(doc(drRohan(), "queues", `${ananya.id}_2030-01-07`), { ...q, next: 9 }));
    await assertFails(setDoc(doc(patient(), "queues", `${ananya.id}_2030-01-08`), { ...q, date: "2030-01-08" }));
    await assertSucceeds(setDoc(doc(owner(), "queues", `${rohan.id}_2030-01-07`), { doctorId: rohan.id, date: "2030-01-07", next: 1 }));
  });
});
