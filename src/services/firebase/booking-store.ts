// BookingStore on Cloud Firestore. Document shapes come from src/lib/records.ts; firestore.rules enforces them.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { collections } from "@/config/firebase";
import type { Booking, BookingStatus } from "@/lib/booking";
import { bookingRecords, slotId, type BookingDraft } from "@/lib/records";
import { SlotTakenError, type BookingStore } from "../types";
import { db } from "./app";

function toBooking(id: string, d: DocumentData): Booking {
  return {
    id,
    code: d.code,
    doctorId: d.doctorId,
    date: d.date,
    time: d.time,
    name: d.name,
    phone: d.phone,
    reason: d.reason,
    status: d.status,
  };
}

export function firebaseBookingStore(): BookingStore {
  const firestore = db();
  const bookingsRef = collection(firestore, collections.bookings);
  const slotsRef = collection(firestore, collections.slots);

  return {
    async takenTimes(doctorId, date) {
      const snap = await getDocs(query(slotsRef, where("doctorId", "==", doctorId), where("date", "==", date)));
      return snap.docs.map((d) => d.data().time as string);
    },

    async create(draft: BookingDraft, code: string) {
      const bookingRef = doc(bookingsRef);
      const { slotId: id, slot, booking } = bookingRecords(draft, bookingRef.id, code);
      const batch = writeBatch(firestore);
      batch.set(bookingRef, { ...booking, createdAt: serverTimestamp() });
      batch.set(doc(slotsRef, id), slot);
      try {
        await batch.commit();
      } catch (error) {
        // The rules refuse a slot that already exists; tell the UI it was taken rather than "permission denied".
        if ((await getDoc(doc(slotsRef, id))).exists()) throw new SlotTakenError();
        throw error;
      }
      return { id: bookingRef.id, ...booking };
    },

    watch(scope, onChange, onError) {
      // A doctor may only list their own bookings (the rules require this filter).
      const q = scope.doctorId ? query(bookingsRef, where("doctorId", "==", scope.doctorId)) : bookingsRef;
      return onSnapshot(
        q,
        (snap) => onChange(snap.docs.map((d) => toBooking(d.id, d.data()))),
        (error) => onError(error),
      );
    },

    async setStatus(booking: Booking, status: BookingStatus) {
      const batch = writeBatch(firestore);
      batch.update(doc(bookingsRef, booking.id), { status });
      if (status === "cancelled") batch.delete(doc(slotsRef, slotId(booking.doctorId, booking.date, booking.time)));
      await batch.commit();
    },

    async removeBefore(date: string) {
      const old = await getDocs(query(bookingsRef, where("date", "<", date)));
      if (old.empty) return 0;
      const batch = writeBatch(firestore); // fine for a small clinic (a batch holds up to 500 writes)
      for (const d of old.docs.slice(0, 250)) {
        const b = toBooking(d.id, d.data());
        batch.delete(d.ref);
        batch.delete(doc(slotsRef, slotId(b.doctorId, b.date, b.time)));
      }
      await batch.commit();
      return Math.min(old.size, 250);
    },
  };
}
