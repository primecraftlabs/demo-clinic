import type { Metadata } from "next";
import { clinic, privacy } from "@/config/clinic";
import { Container, PageIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "What we collect when you book, why, who can see it and how long we keep it.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageIntro eyebrow="Privacy" title="Privacy notice" lead={`How ${clinic.name} looks after the details you share when you book.`} />
      <Container className="py-14">
        <div className="max-w-2xl space-y-8">
          {privacy.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold">{s.title}</h2>
              <p className="mt-2 text-muted">{s.text}</p>
            </section>
          ))}
          <p className="rounded-2xl bg-bg-alt p-5">
            To correct or delete your details,{" "}
            <a href={clinic.whatsappUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline underline-offset-2">
              message us on WhatsApp
            </a>{" "}
            with your booking code.
          </p>
          <p className="text-sm text-muted">Last updated {privacy.updated}</p>
        </div>
      </Container>
    </>
  );
}
