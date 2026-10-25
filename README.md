# Clinic booking demo

A demo clinic website with online appointment booking, built by PrimeCraft Labs.
**The clinic ("Kinara Family Clinic") and its doctors are fictional.**

Patients pick a doctor, a day and a free time slot, then get a booking ID. A clinic dashboard shows every booking
and lets staff mark visits as completed or cancelled. In this demo, bookings are stored only in the visitor's browser.

## Run locally
```
npm ci
npm run dev      # then open http://localhost:3000/demo-clinic/
```

## Test and build
```
npm test         # booking logic tests
npm run lint
npm run build    # static export in out/
```

## Customise
Clinic details and booking rules: `src/config/clinic.ts`. Doctors: `src/data/doctors.ts`.
Colours: `src/app/globals.css`. Studio details come from the generated `src/config/brand.json`.

Built with Next.js, Tailwind CSS and TypeScript. Deployed on GitHub Pages.
