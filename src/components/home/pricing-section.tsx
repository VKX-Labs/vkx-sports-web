"use client";

import { useState } from "react";
import Button from "@/components/ui/button";

type Period = "mensal" | "trimestral" | "semestral" | "anual";

const PERIOD_DETAILS = {
  mensal: {
    label: "Mensal",
    months: 1,
    discount: 0,
  },
  trimestral: {
    label: "Trimestral",
    months: 3,
    discount: 0.1,
  },
  semestral: {
    label: "Semestral",
    months: 6,
    discount: 0.15,
  },
  anual: {
    label: "Anual",
    months: 12,
    discount: 0.25,
  },
};

const PLANS = [
  {
    name: "Start Base",
    subtitle: "Ideal para ligas locais e torneios rápidos.",
    basePrice: 19.9,
    badge: "Ligas Iniciais",
    features: [
      "Até 300 atletas inscritos",
      "Até 3 patrocinadores por torneio",
      "Remoção completa de anúncios",
      "Copas e ligas ilimitadas",
      "Subdomínio próprio para a liga",
      "Emissão de súmulas digitais",
    ],
  },
  {
    name: "Pro Evolution",
    subtitle: "Para organizadores que buscam crescer o negócio.",
    basePrice: 27,
    badge: "Mais Equilibrado",
    features: [
      "Até 600 atletas inscritos",
      "Até 6 patrocinadores por torneio",
      "Remoção completa de anúncios",
      "Copas e ligas ilimitadas",
      "Subdomínio próprio para a liga",
      "Emissão de súmulas digitais",
      "Upload de anexos e regulamentos",
    ],
  },
  {
    name: "Elite League",
    subtitle: "Estrutura robusta para grandes federações.",
    basePrice: 34.9,
    badge: "Alta Volumetria",
    features: [
      "Até 900 atletas inscritos",
      "Até 12 patrocinadores por torneio",
      "Remoção completa de anúncios",
      "Copas e ligas ilimitadas",
      "Subdomínio próprio para a liga",
      "Emissão de súmulas digitais",
      "Upload de anexos e regulamentos",
      "Mídias e fotos em alta resolução",
    ],
  },
  {
    name: "VKX Ultimate",
    subtitle: "Acesso total à infraestrutura enterprise.",
    basePrice: 49.9,
    badge: "Infinito",
    features: [
      "Inscrições de atletas ilimitadas",
      "Espaço para patrocinadores ilimitado",
      "Remoção completa de anúncios",
      "Copas e ligas ilimitadas",
      "Subdomínio próprio para a liga",
      "Emissão de súmulas digitais",
      "Upload de anexos e regulamentos",
      "Mídias e fotos em alta resolução",
      "Exportação de relatórios gerenciais",
      "Widget de incorporação via Script/HTML",
      "Integração direta via API JSON",
    ],
  },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const isHighlightedFeature = (feature: string) =>
  feature.includes("ilimitad") ||
  feature.startsWith("Até") ||
  feature.startsWith("Inscrições") ||
  feature.startsWith("Espaço");

export default function PricingSection() {
  const [period, setPeriod] = useState<Period>("mensal");

  const getMonthlyPrice = (basePrice: number) => {
    const { discount } = PERIOD_DETAILS[period];
    return basePrice * (1 - discount);
  };

  const getTotalPrice = (basePrice: number) => {
    const { months, discount } = PERIOD_DETAILS[period];
    return basePrice * months * (1 - discount);
  };

  return (
    <section
      id="planos"
      className="relative max-w-7xl mx-auto px-6 py-24 border-t border-slate-900"
    >
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 space-y-16">
        <div className="space-y-4 text-center">
          <span className="inline-block rounded-full border border-brand-accent/25 bg-brand-accent/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-brand-accent">
            Tabela de Preços
          </span>

          <h2 className="pt-2 text-4xl md:text-6xl font-black tracking-tight text-white">
            Escolha o nível da sua <br />
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Próxima Competição
            </span>
          </h2>

          <p className="mx-auto max-w-lg text-sm md:text-base text-slate-400">
            Planos transparentes adaptados ao tamanho da sua competição.
          </p>

          <div className="mx-auto mt-6 inline-flex rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1.5 backdrop-blur-md">
            {(Object.keys(PERIOD_DETAILS) as Period[]).map((currentPeriod) => (
              <button
                key={currentPeriod}
                onClick={() => setPeriod(currentPeriod)}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  period === currentPeriod
                    ? "scale-105 bg-brand-accent font-black text-brand-dark shadow-xl shadow-brand-accent/20"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {PERIOD_DETAILS[currentPeriod].label}
              </button>
            ))}
          </div>

          {period !== "mensal" && (
            <p className="text-xs font-semibold text-brand-accent">
              Economize {PERIOD_DETAILS[period].discount * 100}% ao escolher
              este período
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="group relative flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-brand-accent hover:bg-slate-900/90 hover:shadow-[0_0_40px_rgba(34,197,94,0.08)]"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="inline-block rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors duration-300 group-hover:border-brand-accent/30 group-hover:text-brand-accent">
                    {plan.badge}
                  </span>

                  <h3 className="pt-2 text-xl font-black tracking-tight text-white transition-colors duration-300 group-hover:text-brand-accent">
                    {plan.name}
                  </h3>

                  <p className="min-h-[32px] text-xs leading-relaxed text-slate-400">
                    {plan.subtitle}
                  </p>
                </div>

                <div className="border-y border-slate-800/60 py-4 transition-colors duration-300 group-hover:border-brand-accent/20">
                  <div>
                    <span className="text-3xl font-black tracking-tight text-white">
                      {formatCurrency(getMonthlyPrice(plan.basePrice))}
                    </span>

                    <span className="pl-1 text-xs font-medium text-slate-500">
                      /mês
                    </span>
                  </div>

                  {period !== "mensal" && (
                    <p className="mt-2 text-xs text-brand-accent">
                      Cobrado{" "}
                      {formatCurrency(getTotalPrice(plan.basePrice))} por período
                    </p>
                  )}
                </div>

                <ul className="space-y-3.5 text-xs">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-slate-400 transition-colors duration-300 group-hover:text-slate-200"
                    >
                      <span className="font-bold text-slate-600 transition-colors duration-300 group-hover:text-brand-accent">
                        ✓
                      </span>

                      <span
                        className={
                          isHighlightedFeature(feature)
                            ? "font-bold text-slate-300 group-hover:text-white"
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
                  variant="secondary"
                  className="w-full font-bold border-slate-800 text-slate-300 transition-all duration-300 group-hover:border-brand-accent group-hover:bg-brand-accent group-hover:text-brand-dark"
                >
                  Selecionar Plano
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}