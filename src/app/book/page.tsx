import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingFlow } from "@/components/BookingFlow";
import { Container, PageIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "Book an appointment",
  description: "Choose a doctor, date and time and book your appointment online.",
};

export default function BookPage() {
  return (
    <>
      <PageIntro
        eyebrow="Online booking"
        title="Book an appointment"
        lead="Three quick steps: choose a doctor, pick a day and time, and enter the patient's details."
      />
      <Container className="py-12">
        {/* BookingFlow reads ?doctor= from the URL, which only exists in the browser */}
        <Suspense fallback={<p className="text-muted">Loading booking form…</p>}>
          <BookingFlow />
        </Suspense>
      </Container>
    </>
  );
}
