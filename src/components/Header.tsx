"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clinic } from "@/config/clinic";
import { ClinicMark, Icon } from "./Icons";
import { Container } from "./ui";

const nav = [
  { href: "/", label: "Home" },
  { href: "/doctors/", label: "Doctors" },
  { href: "/#visit", label: "Timings & location" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold" aria-label={`${clinic.name}, home`}>
          <ClinicMark />
          <span className="leading-tight">
            {clinic.shortName}
            <span className="block text-xs font-medium text-muted">{clinic.subtitle}</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`font-medium transition hover:text-brand ${isActive(item.href) ? "text-brand" : "text-muted"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/book/" className="rounded-xl bg-brand px-4 py-2 font-semibold text-on-brand hover:bg-brand-strong">
            Book appointment
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/book/" className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-on-brand">
            Book
          </Link>
          <button
            type="button"
            className="p-2"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} className="size-6" />
          </button>
        </div>
      </Container>
      {open && (
        <nav id="mobile-nav" className="border-t border-line bg-surface md:hidden" aria-label="Mobile">
          <Container className="flex flex-col py-2">
            {[...nav, { href: "/book/", label: "Book appointment" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`py-3 font-medium ${isActive(item.href) ? "text-brand" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
