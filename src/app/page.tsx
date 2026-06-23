import Navbar from "@/components/layout/navbar";
import HeroSection from "@/components/home/hero-section";
import TestimonialsSection from "@/components/home/testimonials-section";
import FeaturesSection from "@/components/home/features-section";
import CharacteristicsSection from "@/components/home/characteristics-section";
import ChampionshipsSection from "@/components/home/championships-section";
import PricingSection from "@/components/home/pricing-section";
import Footer from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-textPrimary overflow-x-clip relative scroll-smooth selection:bg-brand-accent selection:text-brand-dark">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none z-0" />

      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] left-[10%] w-[400px] h-[400px] bg-brand-accent/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[70%] right-[10%] w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col">
        <Navbar />

        <section id="inicio" className="pt-4 pb-4">
          <HeroSection />
        </section>

        <div className="my-2">
          <TestimonialsSection />
        </div>

        <section id="features" className="py-8 border-b border-slate-900/40">
          <FeaturesSection />
        </section>

        <section id="funcionalidades" className="py-8 border-b border-slate-900/40">
          <CharacteristicsSection />
        </section>

        <section id="campeonatos" className="py-8 border-b border-slate-900/40">
          <ChampionshipsSection />
        </section>

        <section id="planos" className="py-8">
          <PricingSection />
        </section>

        <Footer />
      </div>
    </div>
  );
}