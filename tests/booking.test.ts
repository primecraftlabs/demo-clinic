// Run with: npm test   (Node 22.18+ runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  type Booking,
  type BookingRules,
  type Doctor,
  availableSlots,
  dateKey,
  formatTime,
  makeBookingId,
  nextDays,
  normalizePhone,
  slotState,
  slotTimes,
  validateBooking,
} from "../src/lib/booking.ts";

const doctor: Doctor = {
  id: "test-doc",
  name: "Dr. Test",
  initials: "DT",
  speciality: "General Physician",
  experience: 5,
  days: [1, 2, 3, 4, 5, 6],
  start: "10:00",
  end: "11:00",
  slotMinutes: 20,
  about: "",
};

const rules: BookingRules = { daysAhead: 7, prebookedEvery: 4, idPrefix: "KFC", maxReasonLength: 200 };

// Monday 2026-10-26, 09:00 local time
const now = new Date(2026, 9, 26, 9, 0);

const booking = (over: Partial<Booking> = {}): Booking => ({
  id: "X",
  doctorId: doctor.id,
  date: "2026-10-26",
  time: "10:00",
  name: "A",
  phone: "",
  reason: "",
  status: "booked",
  createdAt: "",
  ...over,
});

test("slot times respect hours and length", () => {
  assert.deepEqual(slotTimes(doctor), ["10:00", "10:20", "10:40"]);
});

test("next 7 days start today", () => {
  const days = nextDays(now, rules.daysAhead).map(dateKey);
  assert.equal(days.length, 7);
  assert.equal(days[0], "2026-10-26");
  assert.equal(days[6], "2026-11-01");
});

test("no slots on days the doctor does not work", () => {
  assert.deepEqual(availableSlots(doctor, "2026-11-01", [], now, rules), []); // Sunday
});

test("past slots are unavailable", () => {
  const later = new Date(2026, 9, 26, 10, 30);
  assert.equal(slotState(doctor, "2026-10-26", "10:20", [], later, rules), "past");
});

test("a booked slot is taken, a cancelled one is free again", () => {
  const free = availableSlots(doctor, "2026-10-27", [], now, rules).find((s) => s.state === "free");
  assert.ok(free, "expected at least one free slot");
  const taken = [booking({ date: "2026-10-27", time: free.time })];
  assert.equal(slotState(doctor, "2026-10-27", free.time, taken, now, rules), "taken");
  const cancelled = [booking({ date: "2026-10-27", time: free.time, status: "cancelled" })];
  assert.equal(slotState(doctor, "2026-10-27", free.time, cancelled, now, rules), "free");
});

test("phone numbers are normalised", () => {
  assert.equal(normalizePhone("98765 43210"), "9876543210");
  assert.equal(normalizePhone("+91 98765-43210"), "9876543210");
  assert.equal(normalizePhone("09876543210"), "9876543210");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizePhone("5876543210"), null);
});

test("validation reports every missing field", () => {
  const errors = validateBooking({ doctor: undefined, date: "", time: "", name: "", phone: "", reason: "" }, [], now, rules);
  assert.deepEqual(Object.keys(errors).sort(), ["date", "doctor", "name", "phone", "time"]);
});

test("validation accepts a correct booking and rejects a double booking", () => {
  const free = availableSlots(doctor, "2026-10-27", [], now, rules).find((s) => s.state === "free")!;
  const input = { doctor, date: "2026-10-27", time: free.time, name: "Riya Sharma", phone: "9876543210", reason: "" };
  assert.deepEqual(validateBooking(input, [], now, rules), {});
  const errors = validateBooking(input, [booking({ date: "2026-10-27", time: free.time })], now, rules);
  assert.ok(errors.time);
});

test("dates outside the next 7 days are rejected", () => {
  const errors = validateBooking(
    { doctor, date: "2026-11-10", time: "10:00", name: "Riya", phone: "9876543210", reason: "" },
    [],
    now,
    rules,
  );
  assert.ok(errors.date);
});

test("booking ids and time formatting", () => {
  assert.match(makeBookingId("2026-10-27", "KFC", () => 0), /^KFC-261027-AAAA$/);
  assert.equal(formatTime("16:20"), "4:20 PM");
  assert.equal(formatTime("00:05"), "12:05 AM");
  assert.equal(formatTime("12:00"), "12:00 PM");
});

test("pre-booked slots can be turned off", () => {
  const none = availableSlots(doctor, "2026-10-27", [], now, { ...rules, prebookedEvery: 0 });
  assert.ok(none.every((s) => s.state === "free"));
});
