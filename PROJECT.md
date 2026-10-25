# Clinic booking demo (Kinara Family Clinic)

- **Type:** Demo
- **Owner:** Jitender
- **Status:** built and committed locally; not pushed yet
- **Showable:** yes (the clinic and doctors are fictional; every page says so)
- **Stack:** Next.js 16 (App Router, static export), Tailwind CSS 4, TypeScript; bookings in browser localStorage
- **Live link:** https://jeetuwizard.github.io/demo-clinic/ (after the first push + GitHub Pages setup)

## Brief
A showcase clinic website for PrimeCraft Labs to show local clinics what online appointment booking looks like:
patients choose a doctor, a day (next 7 days) and a free time slot, enter their details and get a booking ID;
staff see every booking in a clinic dashboard and mark visits completed or cancelled.

## Pages
- `/` home: hero, services, why choose us, doctors preview, timings, area + directions
- `/doctors/` doctor profiles (initials avatars, no photos of real people)
- `/book/` the booking flow (supports `/book/?doctor=<id>`)
- `/dashboard/` clinic dashboard: today / upcoming / earlier, filter by doctor, status changes,
  "Load sample bookings" and "Clear demo data"

## Configuration (nothing is hard-coded)
| What | Where |
|---|---|
| PrimeCraft Labs details (name, owner, WhatsApp, portfolio URL, GitHub user, this demo's sub-path) | `jk/brand/brand.json` -> run `python jk/brand/sync.py` -> generated `src/config/brand.json` (never edit by hand). `src/config/studio.ts` reads it. |
| Base path for GitHub Pages | `next.config.ts` reads `projects.demoClinic.path` from `src/config/brand.json` |
| Clinic name, tagline, area, masked phone, timings, services, "why us", sample patients, demo notes | `src/config/clinic.ts` |
| Booking rules: days bookable ahead, pre-booked slot ratio, booking ID prefix, max reason length, storage key | `src/config/clinic.ts` (`bookingRules`, `storageKey`) |
| Doctors: names, speciality, experience, working days, hours, slot length | `src/data/doctors.ts` |
| Colours | `src/app/globals.css` (CSS variables -> Tailwind tokens like `bg-brand`, `text-muted`) |
| Favicon | `src/app/icon.svg` (static asset; keep its colours in step with `globals.css`) |

Booking logic (`src/lib/booking.ts`) is pure and receives its rules as parameters; `src/lib/storage.ts` is
the only place that touches browser storage.

## Run / build / test
```
npm ci
npm run dev        # http://localhost:3000/demo-clinic/
npm test           # booking logic unit tests (Node 22.18+)
npm run lint
npm run build      # static site in out/
```
Deploys automatically to GitHub Pages from `main` via `.github/workflows/deploy.yml`
(repo Settings -> Pages -> Source: **GitHub Actions**).

## For a real client
Replace localStorage with Firebase (Firestore for bookings + Auth for the staff dashboard), send confirmations
and reminders by WhatsApp/email, and put the clinic's real details in `src/config/clinic.ts` and doctors in
`src/data/doctors.ts`.

## Testimonial
_(not applicable - demo)_
