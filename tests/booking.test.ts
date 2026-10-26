// Run with: npm test   (Node 22.18+ runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  type BookingRules,
  type Doctor,
  availableSlots,
  dateKey,
  formatTime,
  makeBookingCode,
  nextDays,
  normalizePhone,
  slotState,
  slotTimes,
  validateBooking,
} from "../src/lib/booking.ts";
import { bookingRecords, slotId } from "../src/lib/records.ts";
import { googleCalendarUrl, icsFile } from "../src/lib/calendar.ts";

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

const rules: BookingRules = { daysAhead: 7, codePrefix: "KFC", maxNameLength: 60, maxReasonLength: 200 };

// Monday 2026-10-26, 09:00 local time
const now = new Date(2026, 9, 26, 9, 0);

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
  assert.deepEqual(availableSlots(doctor, "2026-11-01", [], now), []); // Sunday
});

test("past slots are unavailable", () => {
  const later = new Date(2026, 9, 26, 10, 30);
  assert.equal(slotState("2026-10-26", "10:20", [], later), "past");
});

test("taken times are shown as taken, the rest free", () => {
  const slots = availableSlots(doctor, "2026-10-27", ["10:20"], now);
  assert.deepEqual(slots.map((s) => s.state), ["free", "taken", "free"]);
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

test("validation accepts a correct booking and rejects a taken slot", () => {
  const input = { doctor, date: "2026-10-27", time: "10:20", name: "Riya Sharma", phone: "9876543210", reason: "" };
  assert.deepEqual(validateBooking(input, [], now, rules), {});
  assert.ok(validateBooking(input, ["10:20"], now, rules).time);
});

test("dates outside the next 7 days are rejected", () => {
  const errors = validateBooking({ doctor, date: "2026-11-10", time: "10:00", name: "Riya", phone: "9876543210", reason: "" }, [], now, rules);
  assert.ok(errors.date);
});

test("booking codes and time formatting", () => {
  assert.match(makeBookingCode("2026-10-27", "KFC", () => 0), /^KFC-261027-AAAA$/);
  assert.equal(formatTime("16:20"), "4:20 PM");
  assert.equal(formatTime("00:05"), "12:05 AM");
  assert.equal(formatTime("12:00"), "12:00 PM");
});

test("database records: one slot id per doctor/date/time, trimmed patient data", () => {
  assert.equal(slotId("test-doc", "2026-10-27", "10:20"), "test-doc_2026-10-27_1020");
  const r = bookingRecords({ doctorId: "test-doc", date: "2026-10-27", time: "10:20", name: "  Riya ", phone: "9876543210", reason: " Fever " }, "b1", "KFC-261027-AAAA");
  assert.equal(r.slot.bookingId, "b1");
  assert.equal(r.booking.slotId, r.slotId);
  assert.equal(r.booking.name, "Riya");
  assert.equal(r.booking.reason, "Fever");
  assert.equal(r.booking.status, "booked");
});

test("calendar links use the clinic's time zone and the slot length", () => {
  const event = { title: "Visit", details: "Code, ok; bring reports", location: "Clinic", date: "2026-10-27", time: "23:50", minutes: 20, timeZone: "Asia/Kolkata", uid: "b1@x" };
  const url = new URL(googleCalendarUrl("https://calendar.google.com/calendar/render", event));
  assert.equal(url.searchParams.get("dates"), "20261027T235000/20261028T001000");
  assert.equal(url.searchParams.get("ctz"), "Asia/Kolkata");
  const ics = icsFile(event, new Date(Date.UTC(2026, 9, 26)));
  assert.match(ics, /DTSTART;TZID=Asia\/Kolkata:20261027T235000/);
  assert.ok(ics.includes("DESCRIPTION:Code\\, ok\\; bring reports"), "commas and semicolons are escaped");
});
