import Button from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import FeaturesSection from "@/components/layout/features-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-textPrimary overflow-x-clip relative">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
        <div className="flex-1 space-y-6">
          <span className="inline-block bg-green-500/10 text-brand-accent px-4 py-1.5 rounded-full text-sm font-medium tracking-wide">
            PROJETO EM DESENVOLVIMENTO
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Gerencie seus campeonatos de forma{" "}
            <span className="text-brand-accent">fácil</span> e profissional
          </h1>

          <p className="text-lg md:text-xl text-brand-textSecondary max-w-2xl">
            Crie tabelas, chaves de mata-mata, controle estatísticas de
            artilharia, cartões e compartilhe os resultados em tempo real com os
            torcedores.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
            <Button variant="primary">Criar Meu Campeonato</Button>
            <Button variant="secondary">Ver Torneios Ativos</Button>
          </div>
        </div>

        <div className="flex-1 w-full max-w-md bg-brand-card p-6 rounded-2xl border border-slate-750 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent" />

          <h3 className="flex items-center justify-between mb-4 text-xl font-bold">
            <span>Liga VKX de Futebol</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-brand-textSecondary">
              Rodada 3
            </span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-brand-dark p-3 rounded-lg border border-slate-800">
              <span className="font-semibold">Time Alfa</span>
              <span className="bg-brand-card px-3 py-1 rounded font-bold text-brand-accent">
                3 x 1
              </span>
              <span className="font-semibold">Time Beta</span>
            </div>

            <div className="flex items-center justify-between bg-brand-dark p-3 rounded-lg border border-slate-800">
              <span className="font-semibold">Santos FC</span>
              <span className="bg-brand-card px-3 py-1 rounded font-bold text-brand-textSecondary">
                0 x 0
              </span>
              <span className="font-semibold">Flamengo</span>
            </div>
          </div>
        </div>
      </main>

      <FeaturesSection />
    </div>
  );
}