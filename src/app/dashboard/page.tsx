import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";
import { Container, PageIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "Clinic dashboard",
  description: "See and manage today's and upcoming appointments.",
};

export default function DashboardPage() {
  return (
    <>
      <PageIntro
        eyebrow="For clinic staff"
        title="Clinic dashboard"
        lead="Every online booking appears here. Filter by doctor and mark visits as completed or cancelled."
      />
      <Container className="py-12">
        <Dashboard />
      </Container>
    </>
  );
}
