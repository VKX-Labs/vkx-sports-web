import {
  Dices,
  UserCheck,
  Camera,
  FileText,
  BarChart3,
  PenTool,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    label: "Gerador automático de partidas",
    icon: Dices,
  },
  {
    label: "Ranking de jogadores personalizados",
    icon: UserCheck,
  },
  {
    label: "Fotos, vídeos e notícias",
    icon: Camera,
  },
  {
    label: "Imprima súmula das partidas",
    icon: FileText,
  },
  {
    label: "Estatísticas das partidas",
    icon: BarChart3,
  },
  {
    label: "Formulário de inscrição das equipes",
    icon: PenTool,
  },
];

const METRICS = [
  {
    value: "99.9%",
    label: "Uptime Online",
  },
  {
    value: "0.2s",
    label: "Processamento",
  },
  {
    value: "24/7",
    label: "Monitoramento",
  },
];

export default function CharacteristicsSection() {
  return (
    <section className="relative mx-auto max-w-7xl overflow-hidden border-t border-slate-800/60 px-6 py-24">
      <div className="flex flex-col items-center gap-16 lg:flex-row">
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-black leading-tight text-white md:text-5xl">
              Tudo para organizar o <br />
              <span className="text-brand-accent">seu campeonato!</span>
            </h2>

            <p className="max-w-xl text-lg leading-relaxed text-slate-300">
              Nosso foco é dar autonomia total ao organizador. Gerencie
              tabelas, resultados e interaja com atletas e torcedores em uma
              interface intuitiva e veloz.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-brand-accent/50"
              >
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 transition-colors group-hover:border-brand-accent/30">
                  <Icon className="h-5 w-5 text-brand-accent" />
                </div>

                <span className="text-sm font-semibold text-slate-100">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-8 border-t border-slate-900 pt-8">
            {METRICS.map((metric) => (
              <div key={metric.label}>
                <div className="text-3xl font-black text-brand-accent">
                  {metric.value}
                </div>

                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-0 -z-10 rounded-full bg-brand-accent/20 blur-[120px]" />

          <div className="mx-auto max-w-[320px] rotate-2 transform rounded-[3rem] border-[8px] border-slate-800 bg-slate-900 p-4 shadow-2xl transition-transform duration-500 hover:rotate-0">
            <div className="h-[580px] overflow-hidden rounded-[2rem] border border-slate-700/50 bg-brand-dark">
              <div className="flex items-center justify-between border-b border-white/5 bg-brand-card p-4">
                <div className="h-8 w-8 animate-pulse rounded-full bg-brand-accent" />
                <div className="h-2 w-20 rounded-full bg-white/10" />
                <div className="h-4 w-4 rounded-full bg-white/10" />
              </div>

              <div className="space-y-4 p-4">
                <div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />
                <div className="h-12 w-full rounded-xl border border-brand-accent/20 bg-brand-accent/10" />
                <div className="h-12 w-full rounded-xl bg-white/5" />
                <div className="h-12 w-full rounded-xl bg-white/5" />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl md:right-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-accent/20 bg-brand-accent/10">
              <ShieldCheck className="h-6 w-6 text-brand-accent" />
            </div>

            <div>
              <div className="text-sm font-bold text-white">
                Dados Protegidos
              </div>

              <div className="text-[11px] text-slate-400">
                Criptografia de ponta
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}