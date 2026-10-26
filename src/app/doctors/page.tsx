import type { Metadata } from "next";
import { pageBanners } from "@/config/clinic";
import { Icon } from "@/components/Icons";
import { ButtonLink, Container, DoctorAvatar, PageIntro, hoursLabel, workingDays } from "@/components/ui";
import { doctors } from "@/data/doctors";

export const metadata: Metadata = {
  title: "Our doctors",
  description: "Meet the doctors at the clinic and book a slot online.",
};

export default function DoctorsPage() {
  return (
    <>
      <PageIntro
        photo={pageBanners.doctors}
        eyebrow="Our doctors"
        title="Meet the team"
        lead="See each doctor's speciality and consultation days, then book a time that works for you."
      />
      <Container className="grid gap-6 py-14 md:grid-cols-2">
        {doctors.map((d, i) => (
          <article key={d.id} className="flex flex-col rounded-2xl border border-line bg-surface p-7 shadow-sm">
            <div className="flex items-center gap-4">
              <DoctorAvatar doctor={d} index={i} size="size-16 text-xl" />
              <div>
                <h2 className="text-xl font-bold">{d.name}</h2>
                <p className="font-medium text-brand">{d.speciality}</p>
              </div>
            </div>
            <p className="mt-5 flex-1 text-muted">{d.about}</p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-bg-alt p-3">
                <dt className="text-muted">Experience</dt>
                <dd className="font-semibold">{d.experience} years</dd>
              </div>
              <div className="rounded-xl bg-bg-alt p-3">
                <dt className="text-muted">Days</dt>
                <dd className="font-semibold">{workingDays(d)}</dd>
              </div>
              <div className="rounded-xl bg-bg-alt p-3">
                <dt className="text-muted">Hours</dt>
                <dd className="font-semibold">{hoursLabel(d)}</dd>
              </div>
            </dl>
            <ButtonLink href={`/book/?doctor=${d.id}`} className="mt-6 self-start">
              <Icon name="calendar" /> Book with {d.name}
            </ButtonLink>
          </article>
        ))}
      </Container>
    </>
  );
}
