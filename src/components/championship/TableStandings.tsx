export default function TableStandings({ championshipId }: { championshipId: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827]/40 p-6 text-center">
      <p className="text-sm text-slate-400">Tabela de pontos corridos (Liga) em desenvolvimento para o campeonato {championshipId}.</p>
    </div>
  );
}