import Navbar from "@/components/layout/navbar";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";
import CharacteristicsSection from "@/components/home/characteristics-section";
import ChampionshipsSection from "@/components/home/championships-section";
import PricingSection from "@/components/home/pricing-section";
import TestimonialsSection from "@/components/home/testimonials-section"; 

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-textPrimary overflow-x-clip relative scroll-smooth selection:bg-brand-accent selection:text-brand-dark">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col">
        <Navbar />

        <section id="inicio">
          <HeroSection />
        </section>
        <TestimonialsSection />

        <section id="features" className="py-12">
          <FeaturesSection />
        </section>

        <section id="funcionalidades" className="py-12">
          <CharacteristicsSection />
        </section>

        <section id="campeonatos" className="py-12">
          <ChampionshipsSection />
        </section>

        <section id="planos" className="py-12">
          <PricingSection />
        </section>
      </div>
    </div>
  );
}