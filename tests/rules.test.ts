// Firestore security rules tests. Run with: npm run test:rules  (starts the local Firestore emulator; needs Java)
import { after, before, beforeEach, test } from "node:test";
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
import { bookingRecords, type BookingDraft } from "../src/lib/records.ts";

let env: RulesTestEnvironment;

const draft: BookingDraft = {
  doctorId: "ananya-mehra",
  date: "2030-01-07",
  time: "10:20",
  name: "Test Patient",
  phone: "9876543210",
  reason: "Fever",
};

function book(db: Firestore, d: BookingDraft = draft, bookingId = "b1", code = "KFC-300107-AB3D", extra: object = {}) {
  const { slotId, slot, booking } = bookingRecords(d, bookingId, code);
  const batch = writeBatch(db);
  batch.set(doc(db, "bookings", bookingId), { ...booking, createdAt: serverTimestamp(), ...extra });
  batch.set(doc(db, "slots", slotId), slot);
  return batch.commit();
}

const patient = () => env.unauthenticatedContext().firestore() as unknown as Firestore;
const stranger = () => env.authenticatedContext("someone").firestore() as unknown as Firestore;
const staff = () => env.authenticatedContext("staff-1").firestore() as unknown as Firestore;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-kinara",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, "staff/staff-1"), { role: "owner" });
  });
});

after(() => env.cleanup());

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

test("only staff can read patient details", async () => {
  await book(patient());
  await assertFails(getDoc(doc(patient(), "bookings", "b1")));
  await assertFails(getDoc(doc(stranger(), "bookings", "b1")));
  await assertFails(getDocs(collection(stranger(), "bookings")));
  await assertSucceeds(getDoc(doc(staff(), "bookings", "b1")));
  await assertSucceeds(getDocs(collection(staff(), "bookings")));
});

test("staff can change only the status; others can't change anything", async () => {
  await book(patient());
  await assertSucceeds(updateDoc(doc(staff(), "bookings", "b1"), { status: "completed" }));
  await assertFails(updateDoc(doc(staff(), "bookings", "b1"), { name: "Someone else" }));
  await assertFails(updateDoc(doc(staff(), "bookings", "b1"), { status: "deleted" }));
  await assertFails(updateDoc(doc(stranger(), "bookings", "b1"), { status: "cancelled" }));
});

test("after staff cancel and free a slot, it can be booked again", async () => {
  await book(patient());
  const { slotId } = bookingRecords(draft, "b1", "KFC-300107-AB3D");
  await assertFails(deleteDoc(doc(stranger(), "slots", slotId)));
  await assertSucceeds(updateDoc(doc(staff(), "bookings", "b1"), { status: "cancelled" }));
  await assertSucceeds(deleteDoc(doc(staff(), "slots", slotId)));
  await assertSucceeds(book(patient(), draft, "b2", "KFC-300107-ZZZZ"));
});

test("nobody can make themselves staff from the website", async () => {
  await assertFails(setDoc(doc(stranger(), "staff/someone"), { role: "owner" }));
  await assertSucceeds(getDoc(doc(staff(), "staff/staff-1")));
  await assertFails(getDoc(doc(stranger(), "staff/staff-1")));
});
