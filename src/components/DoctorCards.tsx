"use client";

import Link from "next/link";
import { usePublishedDoctors } from "./hooks";
import { Icon } from "./Icons";
import { ButtonLink, DoctorAvatar, Notice, hoursLabel, workingDays } from "./ui";

function Skeleton({ count, className }: { count: number; className: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden="true" className={`animate-pulse rounded-2xl border border-line bg-bg-alt ${className}`} />
      ))}
    </>
  );
}

function Problem({ failed }: { failed: boolean }) {
  return (
    <Notice>
      {failed ? "We couldn't load our doctors. Please check your connection and refresh." : "Our doctors' profiles will appear here soon."}
    </Notice>
  );
}

/** Home page: compact cards. */
export function DoctorPreview() {
  const { doctors, failed } = usePublishedDoctors();
  if (doctors && doctors.length === 0) return <Problem failed={failed} />;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {!doctors && <Skeleton count={4} className="h-56" />}
      {doctors?.map((d, i) => (
        <div key={d.id} className="flex flex-col rounded-2xl border border-line bg-surface p-6">
          <DoctorAvatar doctor={d} index={i} />
          <h3 className="mt-4 font-semibold">{d.name}</h3>
          <p className="text-sm text-brand">{d.speciality}</p>
          <p className="mt-2 flex-1 text-sm text-muted">{workingDays(d)}</p>
          <Link href={`/book/?doctor=${d.id}`} className="mt-4 text-sm font-semibold text-brand hover:underline">
            Book with {d.name} →
          </Link>
        </div>
      ))}
    </div>
  );
}

/** Doctors page: full profiles. */
export function DoctorProfiles() {
  const { doctors, failed } = usePublishedDoctors();
  if (doctors && doctors.length === 0) return <Problem failed={failed} />;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {!doctors && <Skeleton count={4} className="h-80" />}
      {doctors?.map((d, i) => (
        <article key={d.id} className="flex flex-col rounded-2xl border border-line bg-surface p-7 shadow-sm">
          <div className="flex items-center gap-4">
            <DoctorAvatar doctor={d} index={i} size="size-20 text-xl" />
            <div className="min-w-0">
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
          {d.languages.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              <span className="font-semibold text-fg">Languages:</span> {d.languages.join(", ")}
            </p>
          )}
          <ButtonLink href={`/book/?doctor=${d.id}`} className="mt-6 self-start">
            <Icon name="calendar" /> Book with {d.name}
          </ButtonLink>
        </article>
      ))}
    </div>
  );
}
