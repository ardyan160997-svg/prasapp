import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { BookingForm } from "@/components/BookingForm";
import { StudioShowcase } from "@/components/StudioShowcase";
import { EquipmentShowcase } from "@/components/EquipmentShowcase";
import { EventShowcase } from "@/components/EventShowcase";
import { CommunitySection } from "@/components/CommunitySection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <BookingForm />
        <StudioShowcase />
        <EquipmentShowcase />
        <EventShowcase />
        <CommunitySection />
      </main>
      <Footer />
    </>
  );
}