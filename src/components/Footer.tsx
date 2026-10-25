import Link from "next/link";
import { clinic } from "@/config/clinic";
import { studio } from "@/config/studio";
import { ClinicMark, Icon } from "./Icons";
import { Container } from "./ui";

export function Footer() {
  return (
    <footer className="mt-auto">
      <section className="bg-brand text-on-brand">
        <Container className="flex flex-col items-start justify-between gap-5 py-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold">Want online booking for your clinic?</h2>
            <p className="mt-1 text-on-brand/85">This demo was built by {studio.name}. Get the same for your clinic.</p>
          </div>
          <a
            href={studio.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-on-brand px-5 py-3 font-semibold text-brand-strong hover:bg-brand-soft"
          >
            <Icon name="whatsapp" /> Chat on WhatsApp
          </a>
        </Container>
      </section>
      <div className="border-t border-line bg-bg-alt">
        <Container className="grid gap-8 py-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 font-bold">
              <ClinicMark className="size-8" /> {clinic.name}
            </div>
            <p className="mt-3 text-sm text-muted">A fictional clinic used to demonstrate online appointment booking.</p>
          </div>
          <div className="text-sm">
            <h2 className="mb-3 font-semibold">Visit</h2>
            <p className="flex gap-2 text-muted">
              <Icon name="pin" className="size-4 shrink-0" /> {clinic.area}
            </p>
            <p className="mt-2 flex gap-2 text-muted">
              <Icon name="call" className="size-4 shrink-0" /> {clinic.phoneMasked} (demo)
            </p>
          </div>
          <div className="text-sm">
            <h2 className="mb-3 font-semibold">Quick links</h2>
            <ul className="space-y-2 text-muted">
              <li><Link href="/book/" className="hover:text-brand">Book an appointment</Link></li>
              <li><Link href="/doctors/" className="hover:text-brand">Our doctors</Link></li>
              <li><Link href="/dashboard/" className="hover:text-brand">Clinic dashboard</Link></li>
            </ul>
          </div>
        </Container>
        <Container className="border-t border-line py-5 text-sm text-muted">
          <a href={studio.portfolioUrl} className="font-semibold text-fg hover:text-brand">
            Demo website by {studio.name}
          </a>{" "}
          · No real patient data is collected.
        </Container>
      </div>
    </footer>
  );
}
