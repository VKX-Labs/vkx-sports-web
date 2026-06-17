import React from "react";

export default function CharacteristicsSection() {
  const specs = [
    { label: "Gerador automático de partidas", icon: "⚙️" },
    { label: "Ranking de jogadores personalizados", icon: "👤" },
    { label: "Fotos, vídeos e notícias", icon: "📸" },
    { label: "Imprima súmula das partidas", icon: "📄" },
    { label: "Estatísticas das partidas", icon: "📊" },
    { label: "Formulário de inscrição das equipes", icon: "✍️" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 relative overflow-hidden border-t border-slate-800/60">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        
        {/* TEXTOS E GRID DE ESPECIFICAÇÕES */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black leading-tight text-white">
              Tudo para organizar o <br />
              <span className="text-brand-accent">seu campeonato!</span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
              Nosso foco é dar autonomia total ao organizador. Gerencie tabelas, resultados e 
              interaja com atletas e torcedores em uma interface intuitiva e veloz.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {specs.map((spec, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-brand-accent/50 transition-colors group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {spec.icon}
                </span>
                <span className="font-semibold text-slate-100 text-sm">
                  {spec.label}
                </span>
              </div>
            ))}
          </div>

          {/* METRICAS DE PERFORMANCE */}
          <div className="flex flex-wrap gap-8 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-black text-brand-accent">99.9%</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Uptime Online</div>
            </div>
            <div>
              <div className="text-3xl font-black text-brand-accent">0.2s</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Processamento</div>
            </div>
            <div>
              <div className="text-3xl font-black text-brand-accent">24/7</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Monitoramento</div>
            </div>
          </div>
        </div>

        {/* MOCKUP DO APLICATIVO EM DARK MODE */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-[120px] -z-10" />
          
          <div className="relative bg-slate-900 rounded-[3rem] p-4 border-[8px] border-slate-800 shadow-2xl max-w-[320px] mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500">
             <div className="bg-brand-dark rounded-[2rem] overflow-hidden h-[580px] border border-slate-700">
                <div className="p-4 border-b border-white/5 bg-brand-card flex justify-between items-center">
                  <div className="w-8 h-8 bg-brand-accent rounded-full" />
                  <div className="w-20 h-2 bg-white/10 rounded-full" />
                  <div className="w-4 h-4 bg-white/10 rounded-full" />
                </div>
                <div className="p-4 space-y-4">
                  <div className="h-32 w-full bg-white/5 rounded-2xl" />
                  <div className="h-12 w-full bg-brand-accent/10 rounded-xl border border-brand-accent/20" />
                  <div className="h-12 w-full bg-white/5 rounded-xl" />
                  <div className="h-12 w-full bg-white/5 rounded-xl" />
                </div>
             </div>
          </div>

          {/* BADGE DE SEGURANÇA */}
          <div className="absolute -bottom-6 -right-6 md:right-0 bg-brand-card border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">
              🔒
            </div>
            <div>
              <div className="font-bold text-white">Dados Protegidos</div>
              <div className="text-xs text-slate-400">Criptografia de ponta</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}