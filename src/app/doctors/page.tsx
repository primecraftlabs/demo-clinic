import type { Metadata } from "next";
import { pageBanners } from "@/config/clinic";
import { DoctorProfiles } from "@/components/DoctorCards";
import { Container, PageIntro } from "@/components/ui";

export const metadata: Metadata = {
  title: "Our doctors",
  description: "Meet the doctors at the clinic and book a slot online.",
};

export default function DoctorsPage() {
  return (
    <>
      <PageIntro
        photo={pageBanners.doctors}
        eyebrow="Our doctors"
        title="Meet the team"
        lead="See each doctor's speciality and consultation days, then book a time that works for you."
      />
      <Container className="py-14">
        <DoctorProfiles />
      </Container>
    </>
  );
}
