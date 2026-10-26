import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Doctor } from "@/lib/booking";
import { DAY_NAMES, formatTime } from "@/lib/booking";
import { Icon } from "./Icons";
import { Photo } from "./Photo";
import { avatarDataUri } from "./avatar";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

const buttonStyles = {
  primary: "bg-brand text-on-brand hover:bg-brand-strong",
  outline: "border border-line bg-surface text-fg hover:bg-bg-alt",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function SectionTitle({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="mb-2 text-sm font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight text-balance">{title}</h2>
      {lead && <p className="mt-3 text-lg text-muted">{lead}</p>}
    </div>
  );
}

const avatarColors = [
  "bg-avatar-1-bg text-avatar-1-fg",
  "bg-avatar-2-bg text-avatar-2-fg",
  "bg-avatar-3-bg text-avatar-3-fg",
  "bg-avatar-4-bg text-avatar-4-fg",
];

/** The doctor's chosen avatar (or initials) on a soft colour. Decorative: the name is always shown next to it. */
export function DoctorAvatar({ doctor, index = 0, size = "size-14 text-lg" }: { doctor: Doctor; index?: number; size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold ${size} ${avatarColors[index % avatarColors.length]}`}
    >
      {doctor.avatar ? <Image src={avatarDataUri(doctor.avatar)} alt="" fill sizes="96px" unoptimized className="object-cover" /> : doctor.initials}
    </span>
  );
}

export function workingDays(doctor: Doctor): string {
  const names = doctor.days.map((d) => DAY_NAMES[d].slice(0, 3));
  return names.join(", ");
}

export function hoursLabel(doctor: Doctor): string {
  return `${formatTime(doctor.start)} – ${formatTime(doctor.end)}`;
}

/** Page heading band. With `photo` (a slot in photos.json) it becomes a photo banner, like the home page. */
export function PageIntro({ eyebrow, title, lead, photo }: { eyebrow: string; title: string; lead: string; photo?: string }) {
  if (!photo) {
    return (
      <section className="border-b border-line bg-bg-alt">
        <Container className="py-12 sm:py-16">
          <p className="mb-2 text-sm font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{lead}</p>
        </Container>
      </section>
    );
  }
  return (
    <section className="relative isolate overflow-hidden bg-brand-strong text-on-brand">
      <Photo slot={photo} width={1600} height={600} preload className="-z-10" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-brand-strong via-brand-strong/85 to-brand-strong/40" />
      <Container className="py-14 sm:py-20">
        <p className="mb-2 text-sm font-semibold tracking-wide text-on-brand/80 uppercase">{eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg text-on-brand/90">{lead}</p>
      </Container>
    </section>
  );
}

/** A calm information box (e.g. the concept-site notice). Renders nothing when the text is empty. */
export function Notice({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="flex gap-2 rounded-xl border border-info-line bg-info-bg px-4 py-3 text-sm text-info-fg">
      <Icon name="info" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
