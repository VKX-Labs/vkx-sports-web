"use client";

const TESTIMONIALS = [
  {
    quote:
      "Gerenciar a nossa liga regional ficou infinitamente mais prático. A emissão de súmulas automatizada nos poupou horas de trabalho manual pós-jogo.",
    author: "Carlos Eduardo",
    role: "Diretor da LPF",
    avatar: "👨‍💼",
  },
  {
    quote:
      "O sistema de busca integrada e o painel focado em performance são fantásticos. Meus atletas acompanham as tabelas em tempo real sem lentidão.",
    author: "Marcos Silva",
    role: "Organizador de Torneios",
    avatar: "⚽",
  },
  {
    quote:
      "Migramos toda a nossa estrutura para a plataforma e a experiência foi impecável. O carregamento de mídias em alta resolução valorizou muito nossos patrocinadores.",
    author: "Rodrigo Melo",
    role: "Coordenador de Eventos",
    avatar: "🏆",
  },
  {
    quote:
      "Interface limpa, rápida e direto ao ponto. A flexibilidade para configurar as regras e os subdomínios próprios deu uma cara profissional para o nosso campeonato.",
    author: "André Fontana",
    role: "Presidente da Liga Metropolitana",
    avatar: "🥇",
  },
];

export default function TestimonialsSection() {
  const testimonials = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <section className="relative w-full overflow-hidden border-y border-slate-900 bg-brand-dark/40 py-10">
      <div className="pointer-events-none absolute left-0 top-0 z-20 h-full w-24 bg-gradient-to-r from-brand-dark to-transparent md:w-48" />

      <div className="pointer-events-none absolute right-0 top-0 z-20 h-full w-24 bg-gradient-to-l from-brand-dark to-transparent md:w-48" />

      <div className="mx-auto mb-6 max-w-7xl px-6">
        <p className="text-center text-[10px] font-black uppercase tracking-widest text-brand-accent lg:text-left">
          Validação Real • Quem utiliza aprova
        </p>
      </div>

      <div className="relative flex w-full overflow-hidden">
        <div className="flex gap-6 whitespace-nowrap py-2 hover:[animation-play-state:paused] animate-[marquee_35s_linear_infinite]">
          {testimonials.map((testimonial, index) => (
            <article
              key={`${testimonial.author}-${index}`}
              className="inline-block w-[320px] shrink-0 rounded-2xl border border-slate-800/80 bg-brand-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-950/60 md:w-[420px]"
            >
              <div className="space-y-4 whitespace-normal">
                <p className="text-xs italic leading-relaxed text-slate-300 md:text-sm">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="h-px w-full bg-slate-800/60" />

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-lg">
                    {testimonial.avatar}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold tracking-tight text-white">
                      {testimonial.author}
                    </h4>

                    <p className="text-[10px] font-medium text-brand-textSecondary">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}