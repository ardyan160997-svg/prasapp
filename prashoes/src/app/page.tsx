import Header from "@/components/Header";
import HeroVisual from "@/components/HeroVisual";
import TrackingSection from "@/components/TrackingSection";
import PricelistSection from "@/components/PricelistSection";
import PromoSection from "@/components/PromoSection";
import PickupForm from "@/components/PickupForm";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroVisual />
      <TrackingSection />
      <PricelistSection />
      <PromoSection />
      <PickupForm />
      <BeforeAfterSlider />
      <Footer />
    </main>
  );
}
