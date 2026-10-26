// "Add to calendar" helpers (pure). The event is in the clinic's own time zone, whatever the visitor's device says.

export type CalendarEvent = {
  title: string;
  details: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  minutes: number;
  timeZone: string; // IANA, e.g. Asia/Kolkata
  uid: string;
};

/** Local wall-clock time as "YYYYMMDDTHHMMSS" (no zone; the zone is passed separately). */
function stamp(date: string, time: string, plusMinutes = 0): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi + plusMinutes));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`;
}

export function googleCalendarUrl(base: string, e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    details: e.details,
    location: e.location,
    dates: `${stamp(e.date, e.time)}/${stamp(e.date, e.time, e.minutes)}`,
    ctz: e.timeZone,
  });
  return `${base}?${params}`;
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
}

/** An .ics file (works with Apple, Outlook and most phone calendars). */
export function icsFile(e: CalendarEvent, now: Date = new Date()): string {
  const created = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Clinic booking//EN",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${created}`,
    `DTSTART;TZID=${e.timeZone}:${stamp(e.date, e.time)}`,
    `DTEND;TZID=${e.timeZone}:${stamp(e.date, e.time, e.minutes)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `DESCRIPTION:${escapeIcs(e.details)}`,
    `LOCATION:${escapeIcs(e.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
