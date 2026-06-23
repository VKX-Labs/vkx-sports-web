"use client";

import { useState } from "react";
import Button from "@/components/ui/button";

type Period = "mensal" | "trimestral" | "semestral" | "anual";

const PERIOD_DETAILS = {
  mensal: {
    label: "Mensal",
    discountMultiplier: 1,
    suffix: "/mês",
  },
  trimestral: {
    label: "Trimestral",
    discountMultiplier: 0.9,
    suffix: "/mês",
  },
  semestral: {
    label: "Semestral",
    discountMultiplier: 0.85,
    suffix: "/mês",
  },
  anual: {
    label: "Anual",
    discountMultiplier: 0.75,
    suffix: "/mês",
  },
};

const PLANS = [
  {
    name: "PEQUENOS",
    basePrice: 19.9,
    icon: "⭐",
    isPopular: false,
    features: [
      "Até 300 jogadores por campeonato",
      "Até 3 patrocinadores por campeonato",
      "Campeonatos sem propagandas",
      "Campeonatos ilimitados",
      "URL personalizada *",
      "Súmula **",
    ],
  },
  {
    name: "INTERMEDIÁRIOS",
    basePrice: 27,
    icon: "🏅",
    isPopular: true,
    features: [
      "Até 600 jogadores por campeonato",
      "Até 6 patrocinadores por campeonato",
      "Campeonatos sem propagandas",
      "Campeonatos ilimitados",
      "URL personalizada *",
      "Súmula **",
      "Adicionar arquivos de anexo",
    ],
  },
  {
    name: "GRANDES",
    basePrice: 34.9,
    icon: "💎",
    isPopular: false,
    features: [
      "Até 900 jogadores por campeonato",
      "Até 12 patrocinadores por campeonato",
      "Campeonatos sem propagandas",
      "Campeonatos ilimitados",
      "URL personalizada *",
      "Súmula **",
      "Adicionar arquivos de anexo",
      "Melhor resolução de imagens",
    ],
  },
  {
    name: "ORGANIZADOR PROFISSIONAL",
    basePrice: 49.9,
    icon: "👑",
    isPopular: false,
    features: [
      "Sem limite de jogadores",
      "Sem limite de patrocinadores",
      "Campeonatos sem propagandas",
      "Campeonatos ilimitados",
      "URL personalizada *",
      "Súmula **",
      "Adicionar arquivos de anexo",
      "Melhor resolução de imagens",
      "Imprimir relatórios",
      "Opção de incorporação HTML",
      "Acesso à API JSON",
    ],
  },
];

const isHighlightedFeature = (feature: string) =>
  feature.startsWith("Até") || feature.startsWith("Sem limite");

export default function PricingSection() {
  const [period, setPeriod] = useState<Period>("mensal");

  const formatPrice = (price: number) => {
    const calculated =
      price * PERIOD_DETAILS[period].discountMultiplier;

    return calculated.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <section
      id="planos"
      className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-800/60"
    >
      <div className="relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Nossos <span className="text-brand-accent">Planos</span>
          </h2>

          <p className="text-sm md:text-base text-brand-textSecondary">
            Temos planos na medida certa para o seu bolso!
          </p>

          <div className="inline-flex mx-auto mt-4 p-1.5 rounded-2xl border border-slate-800 bg-slate-900">
            {(Object.keys(PERIOD_DETAILS) as Period[]).map((currentPeriod) => (
              <button
                key={currentPeriod}
                onClick={() => setPeriod(currentPeriod)}
                className={`px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                  period === currentPeriod
                    ? "bg-brand-accent text-brand-dark shadow-lg shadow-brand-accent/20 scale-105"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {PERIOD_DETAILS[currentPeriod].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 items-start md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex min-h-[580px] flex-col justify-between rounded-2xl border p-6 shadow-xl transition-all duration-300 ${
                plan.isPopular
                  ? "border-brand-accent bg-gradient-to-b from-brand-card to-brand-dark scale-102 lg:-translate-y-2 shadow-brand-accent/5"
                  : "border-slate-800/80 bg-brand-card hover:border-slate-700"
              }`}
            >
              {plan.isPopular && (
                <span className="absolute left-1/2 -top-3.5 -translate-x-1/2 rounded-full bg-brand-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-dark">
                  Mais Escolhido
                </span>
              )}

              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl shadow-inner">
                    {plan.icon}
                  </div>

                  <p className="text-xs font-black uppercase tracking-widest text-brand-textSecondary">
                    Campeonatos
                  </p>

                  <h3 className="text-lg font-black leading-tight text-white">
                    {plan.name}
                  </h3>
                </div>

                <div className="border-y border-slate-800/60 py-4 text-center">
                  <span className="text-3xl font-black text-white">
                    {formatPrice(plan.basePrice)}
                  </span>

                  <span className="mt-1 block text-xs font-semibold text-slate-400">
                    {PERIOD_DETAILS[period].suffix}
                  </span>
                </div>

                <ul className="space-y-3 text-left text-xs">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-slate-300"
                    >
                      <span className="font-bold text-brand-accent">✓</span>

                      <span
                        className={
                          isHighlightedFeature(feature)
                            ? "font-bold text-white"
                            : ""
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button
                  variant={plan.isPopular ? "primary" : "secondary"}
                  className="w-full font-bold"
                >
                  Assinar Plano
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}