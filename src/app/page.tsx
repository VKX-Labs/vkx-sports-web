import Button from "@/components/ui/button";


export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-brand-textPrimary">
      {/* HEADER / NAVBAR SIMPLES */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-800">
        <div className="text-2xl font-bold tracking-wider text-brand-textPrimary">
          VKX<span className="text-brand-accent">SPORTS</span>
        </div>
        <nav className="hidden md:flex space-x-8 text-brand-textSecondary">
          <a href="#funcionalidades" className="hover:text-brand-textPrimary transition">Funcionalidades</a>
          <a href="#planos" className="hover:text-brand-textPrimary transition">Planos</a>
        </nav>
        <div>
          <Button variant="secondary">Entrar</Button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6">
          <span className="inline-block bg-green-500/10 text-brand-accent px-4 py-1.5 rounded-full text-sm font-medium tracking-wide">
            PROJETO EM DESENVOLVIMENTO
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Gerencie seus campeonatos de forma <span className="text-brand-accent">fácil</span> e profissional
          </h1>
          <p className="text-brand-textSecondary text-lg md:text-xl max-w-2xl">
            Crie tabelas, chaves de mata-mata, controle estatísticas de artilharia, cartões e compartilhe os resultados em tempo real com os torcedores.
          </p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 pt-4">
            <Button variant="primary">Criar Meu Campeonato</Button>
            <Button variant="secondary">Ver Torneios Ativos</Button>
          </div>
        </div>
        
        {/* CARD SIMULANDO A INTERFACE */}
        <div className="flex-1 w-full max-w-md bg-brand-card p-6 rounded-2xl border border-slate-750 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent"></div>
          <h3 className="text-xl font-bold mb-4 flex justify-between items-center">
            <span>Liga VKX de Futebol</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded text-brand-textSecondary">Rodada 3</span>
          </h3>
          <div className="space-y-3">
            {/* Jogo 1 */}
            <div className="bg-brand-dark p-3 rounded-lg flex justify-between items-center border border-slate-800">
              <span className="font-semibold">Time Alfa</span>
              <span className="bg-brand-card px-3 py-1 rounded font-bold text-brand-accent">3 x 1</span>
              <span className="font-semibold">Time Beta</span>
            </div>
            {/* Jogo 2 */}
            <div className="bg-brand-dark p-3 rounded-lg flex justify-between items-center border border-slate-800">
              <span className="font-semibold">Santos FC</span>
              <span className="bg-brand-card px-3 py-1 rounded font-bold text-brand-textSecondary">0 x 0</span>
              <span className="font-semibold">Flamengo</span>
            </div>
          </div>
        </div>
      </main>

      {/* SEÇÃO DE FUNCIONALIDADES */}
      <section id="funcionalidades" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-800">
        <h2 className="text-3xl font-bold text-center mb-12">Tudo o que você precisa para seu torneio</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-brand-card p-6 rounded-xl border border-slate-800">
            <div className="text-brand-accent text-3xl mb-4">🏆</div>
            <h4 className="text-xl font-bold mb-2">Mata-Mata Automatizado</h4>
            <p className="text-brand-textSecondary text-sm">Gere chaves de oitavas, quartas, semis e final automaticamente com um clique.</p>
          </div>
          <div className="bg-brand-card p-6 rounded-xl border border-slate-800">
            <div className="text-brand-accent text-3xl mb-4">📊</div>
            <h4 className="text-xl font-bold mb-2">Tabela de Classificação</h4>
            <p className="text-brand-textSecondary text-sm">Cálculo em tempo real de pontos, saldo de gols, vitórias e critérios de desempate.</p>
          </div>
          <div className="bg-brand-card p-6 rounded-xl border border-slate-800">
            <div className="text-brand-accent text-3xl mb-4">⚽</div>
            <h4 className="text-xl font-bold mb-2">Artilharia e Cartões</h4>
            <p className="text-brand-textSecondary text-sm">Controle completo de suspensões, lista de goleadores e assistências do campeonato.</p>
          </div>
        </div>
      </section>
    </div>
  );
}