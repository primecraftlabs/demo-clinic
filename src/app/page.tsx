import Link from "next/link";
import { Icon } from "@/components/Icons";
import { Photo } from "@/components/Photo";
import { DoctorPreview } from "@/components/DoctorCards";
import { ButtonLink, Container, SectionTitle } from "@/components/ui";
import { about, clinic, faqs, gallery, howItWorks, reasons, services } from "@/config/clinic";

export default function Home() {
  return (
    <>
      <section className="bg-linear-to-b from-brand-soft to-bg">
        <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-brand shadow-sm">
              <Icon name="pin" className="size-4" /> {clinic.area}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">Book an appointment in 30 seconds</h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              Choose your doctor, pick a free time and get your booking code instantly. {clinic.tagline}
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
              {["No phone calls needed", "Live free slots", "Instant booking code"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Icon name="check" className="size-4 text-brand" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
            <Photo slot="hero" width={1100} height={825} sizes="(min-width: 1024px) 45vw, 100vw" preload />
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

      <section className="pb-16 sm:pb-20" aria-labelledby="about-title">
        <Container className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg">
            <Photo slot="about" width={1000} height={750} sizes="(min-width: 768px) 50vw, 100vw" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold tracking-wide text-brand uppercase">{about.eyebrow}</p>
            <h2 id="about-title" className="text-3xl font-bold tracking-tight text-balance">{about.title}</h2>
            {about.paragraphs.map((p) => (
              <p key={p} className="mt-4 text-muted">{p}</p>
            ))}
            <ul className="mt-6 space-y-3">
              {about.points.map((pt) => (
                <li key={pt.text} className="flex items-center gap-3 font-semibold">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Icon name={pt.icon} className="size-5" />
                  </span>
                  {pt.text}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-bg-alt py-16 sm:py-20">
        <Container>
          <SectionTitle eyebrow="Online booking" title="How booking works" />
          <ol className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-surface p-6 shadow-sm">
                <span className="grid size-10 place-items-center rounded-full bg-brand font-bold text-on-brand">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <ButtonLink href="/book/" className="mt-8">
            <Icon name="calendar" /> Book now
          </ButtonLink>
        </Container>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="inside-title">
        <Container>
          <div className="mb-10 max-w-2xl">
            <p className="mb-2 text-sm font-semibold tracking-wide text-brand uppercase">Inside the clinic</p>
            <h2 id="inside-title" className="text-3xl font-bold tracking-tight text-balance">Calm, clean and child-friendly</h2>
          </div>
          <div className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:gap-4 md:grid-cols-3">
            {gallery.map((g, i) => (
              <figure key={g.slot} className={`relative overflow-hidden rounded-2xl ${i === 0 ? "row-span-2" : ""}`}>
                <Photo slot={g.slot} width={800} height={i === 0 ? 1000 : 600} sizes="(min-width: 768px) 33vw, 50vw" />
                <figcaption className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold sm:text-sm">
                  {g.label}
                </figcaption>
              </figure>
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
          <DoctorPreview />
        </Container>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="faq-title">
        <Container className="max-w-3xl">
          <p className="mb-2 text-sm font-semibold tracking-wide text-brand uppercase">Questions</p>
          <h2 id="faq-title" className="text-3xl font-bold tracking-tight">Good to know</h2>
          <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <Icon name="arrow" className="size-4 shrink-0 rotate-90 text-brand transition group-open:-rotate-90" />
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section id="visit" className="relative isolate overflow-hidden bg-brand-strong py-16 sm:py-20">
        <Photo slot="visit" width={1600} sizes="100vw" className="-z-10 opacity-25" />
        <Container className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-surface p-7 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Icon name="clock" className="size-6 text-brand" /> Clinic timings
            </h2>
            <dl className="mt-5 divide-y divide-line">
              {clinic.hours.map((h) => (
                <div key={h.days} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
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
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={clinic.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 font-semibold hover:bg-bg-alt"
              >
                Get directions <Icon name="arrow" className="size-4" />
              </a>
              <a
                href={clinic.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-on-brand hover:bg-brand-strong"
              >
                <Icon name="whatsapp" /> WhatsApp us
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
