import Link from "next/link";
import { Icon } from "@/components/Icons";
import { ButtonLink, Container, DoctorAvatar, SectionTitle, workingDays } from "@/components/ui";
import { clinic, reasons, services } from "@/config/clinic";
import { doctors } from "@/data/doctors";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-linear-to-b from-brand-soft to-bg">
        <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-brand shadow-sm">
              <Icon name="pin" className="size-4" /> {clinic.area}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">Book an appointment in 30 seconds</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Choose your doctor, pick a time that suits you and get instant confirmation. {clinic.tagline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/book/">
                <Icon name="calendar" /> Book appointment
              </ButtonLink>
              <ButtonLink href="/doctors/" variant="outline">
                Meet our doctors
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["No phone calls needed", "Only free slots shown", "Instant confirmation"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Icon name="check" className="size-4 text-brand" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden="true" className="mx-auto w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-xl">
            <p className="text-sm font-semibold text-muted">Next available</p>
            <div className="mt-3 flex items-center gap-3">
              <DoctorAvatar doctor={doctors[0]} />
              <div>
                <p className="font-semibold">{doctors[0].name}</p>
                <p className="text-sm text-muted">{doctors[0].speciality}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["10:00 AM", "10:20 AM", "10:40 AM", "11:00 AM", "11:20 AM", "11:40 AM"].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-lg border py-2 text-center text-sm font-medium ${
                    i === 1 ? "border-brand bg-brand text-on-brand" : i === 3 ? "border-line text-muted line-through" : "border-line"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-strong">
              ✓ Appointment confirmed for 10:20 AM
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <SectionTitle eyebrow="Services" title="Care for every member of the family" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl border border-line bg-surface p-6">
                <span className="mb-4 grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={s.icon} className="size-6" />
                </span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-bg-alt py-16 sm:py-20">
        <Container>
          <SectionTitle eyebrow="Why choose us" title="Simple, friendly and on time" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r, i) => (
              <div key={r.title} className="rounded-2xl bg-surface p-6 shadow-sm">
                <span className="mb-3 block text-sm font-bold text-brand">0{i + 1}</span>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-2 text-muted">{r.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle eyebrow="Our doctors" title="Experienced, caring doctors" />
            <Link href="/doctors/" className="mb-10 inline-flex items-center gap-1.5 font-semibold text-brand">
              All doctors <Icon name="arrow" className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((d, i) => (
              <div key={d.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
                <DoctorAvatar doctor={d} index={i} />
                <h3 className="mt-4 font-semibold">{d.name}</h3>
                <p className="text-sm text-brand">{d.speciality}</p>
                <p className="mt-2 flex-1 text-sm text-muted">{workingDays(d)}</p>
                <Link href={`/book/?doctor=${d.id}`} className="mt-4 text-sm font-semibold text-brand hover:underline">
                  Book with {d.name.replace("Dr. ", "Dr ")} →
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-bg-alt py-16 sm:py-20">
        <Container className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-surface p-7 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Icon name="clock" className="size-6 text-brand" /> Clinic timings
            </h2>
            <dl className="mt-5 divide-y divide-line">
              {clinic.hours.map((h) => (
                <div key={h.days} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">{h.days}</dt>
                  <dd className="font-semibold">{h.time}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted">Each doctor has their own consultation hours, shown when you book.</p>
          </div>
          <div className="rounded-2xl bg-surface p-7 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Icon name="pin" className="size-6 text-brand" /> Find us
            </h2>
            <p className="mt-5 text-lg font-semibold">{clinic.area}</p>
            <p className="mt-1 text-muted">{clinic.areaNote}</p>
            <p className="mt-1 text-muted">Phone: {clinic.phoneMasked} (demo)</p>
            <a
              href={clinic.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 font-semibold hover:bg-bg-alt"
            >
              Get directions <Icon name="arrow" className="size-4" />
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
