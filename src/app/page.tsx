import Navbar from "@/components/layout/navbar";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";
import CharacteristicsSection from "@/components/home/characteristics-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-textPrimary overflow-x-clip relative scroll-smooth selection:bg-brand-accent selection:text-brand-dark">
      
      {/* Luz ambiente de fundo para suavizar a rolagem e dar profundidade */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col">
        {/* Navbar fixa no topo com blur */}
        <Navbar />

        {/* Blocos da página com espaçamento equilibrado para rolagem fluida */}
        <section id="inicio" className="animate-fade-in">
          <HeroSection />
        </section>

        <section id="features" className="py-12">
          <FeaturesSection />
        </section>

        <section id="funcionalidades" className="py-12">
          <CharacteristicsSection />
        </section>
      </div>
    </div>
  );
}