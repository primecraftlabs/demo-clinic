import Link from "next/link";
import type { ReactNode } from "react";
import type { Doctor } from "@/lib/booking";
import { DAY_NAMES, formatTime } from "@/lib/booking";

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

export function DoctorAvatar({ doctor, index = 0, size = "size-14 text-lg" }: { doctor: Doctor; index?: number; size?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full font-bold ${size} ${avatarColors[index % avatarColors.length]}`}>
      {doctor.initials}
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

export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
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

export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl border border-info-line bg-info-bg px-4 py-3 text-sm text-info-fg">
      <span aria-hidden="true">ℹ️</span>
      <span>{children}</span>
    </p>
  );
}

