import type { Metadata } from "next";
import { Suspense } from "react";
import { StaffArea } from "@/components/StaffArea";
import { Container, PageIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "Clinic dashboard",
  description: "Staff view of today's and upcoming appointments.",
};

export default function DashboardPage() {
  return (
    <>
      <PageIntro
        eyebrow="For clinic staff"
        title="Clinic dashboard"
        lead="Every online booking appears here instantly. Filter by doctor and mark visits as completed or cancelled."
      />
      <Container className="py-12">
        {/* StaffArea reads ?preview from the URL, which only exists in the browser */}
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <StaffArea />
        </Suspense>
      </Container>
    </>
  );
}
