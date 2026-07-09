import Button from "@/components/ui/button";

const FEATURES_DATA = [
  {
    icon: "🏆",
    title: "Mata-Mata Automatizado",
    description: "Gere chaves de oitavas, quartas, semis e final automaticamente com um único clique, adaptando o chaveamento ao número de equipes.",
    badge: "Automatizado"
  },
  {
    icon: "📊",
    title: "Tabela de Classificação",
    description: "Cálculo em tempo real de pontos, saldo de gols, cartões e critérios de desempate complexos de forma instantânea.",
    badge: "Real-time"
  },
  {
    icon: "⚽",
    title: "Artilharia e Estatísticas",
    description: "Controle completo de suspensões automáticas por cartões, lista de goleadores, assistências e scouts individuais dos atletas.",
    badge: "Completo"
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-8 border-t border-slate-800/60 relative">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {FEATURES_DATA.map((item, index) => (
          <div 
            key={index} 
            className="group bg-brand-card p-8 rounded-2xl border border-slate-700/80 hover:border-brand-accent transition-all duration-300 flex flex-col justify-between shadow-2xl hover:shadow-brand-accent/10 hover:-translate-y-1"
          >
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div className="text-4xl bg-slate-900 p-3.5 rounded-xl border border-slate-700 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-slate-800 border border-slate-700 px-3 py-1 rounded">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-2xl font-black text-white group-hover:text-brand-accent transition-colors duration-200 tracking-tight">
                {item.title}
              </h3>

              <p className="text-slate-200 text-base font-medium leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-700/60">
              <Button 
                variant="secondary" 
                className="w-full text-sm font-bold py-3 bg-slate-800/80 border border-slate-600 text-white hover:bg-brand-accent hover:text-brand-dark hover:border-brand-accent transition-all duration-300 shadow-md"
              >
                Configurar Recurso
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}