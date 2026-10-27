import Link from "next/link";
import { clinic, concept } from "@/config/clinic";
import { studio } from "@/config/studio";
import { ClinicMark, Icon } from "./Icons";
import { Container } from "./ui";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-bg-alt">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5 font-bold">
            <ClinicMark className="size-8" /> {clinic.name}
          </div>
          <p className="mt-3 text-sm text-muted">{clinic.tagline}</p>
        </div>
        <div className="text-sm">
          <h2 className="mb-3 font-semibold">Visit</h2>
          <a href={clinic.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-muted hover:text-brand">
            <Icon name="pin" className="size-4 shrink-0" /> {clinic.area}
          </a>
          <a href={clinic.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex gap-2 text-muted hover:text-brand">
            <Icon name="whatsapp" className="size-4 shrink-0" /> WhatsApp us
          </a>
        </div>
        <div className="text-sm">
          <h2 className="mb-3 font-semibold">Timings</h2>
          <ul className="space-y-1 text-muted">
            {clinic.hours.map((h) => (
              <li key={h.days}>
                {h.days}: <span className="text-fg">{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <h2 className="mb-3 font-semibold">Quick links</h2>
          <ul className="space-y-2 text-muted">
            <li><Link href="/book/" className="hover:text-brand">Book an appointment</Link></li>
            <li><Link href="/doctors/" className="hover:text-brand">Our doctors</Link></li>
            <li><Link href="/dashboard/" className="hover:text-brand">Staff login</Link></li>
            <li><Link href="/privacy/" className="hover:text-brand">Privacy</Link></li>
            <li><Link href="/credits/" className="hover:text-brand">Photo credits</Link></li>
          </ul>
        </div>
      </Container>
      <Container className="border-t border-line py-5 text-sm text-muted">
        <p>
          {concept.footer}{" "}
          <a href={studio.portfolioUrl} className="font-semibold text-fg hover:text-brand">
            About {studio.name}
          </a>
        </p>
        <p className="mt-1">
          <a href={studio.enquiryUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brand">
            Want online booking for your clinic?
          </a>
        </p>
      </Container>
    </footer>
  );
}
