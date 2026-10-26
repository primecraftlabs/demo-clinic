import { Icon } from "@/components/Icons";
import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="max-w-xl py-24 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
        <Icon name="stethoscope" className="size-8" />
      </span>
      <h1 className="mt-4 text-3xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved. You can still book an appointment in a few taps.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/book/">
          <Icon name="calendar" /> Book appointment
        </ButtonLink>
        <ButtonLink href="/" variant="outline">
          Back to home
        </ButtonLink>
      </div>
    </Container>
  );
}
