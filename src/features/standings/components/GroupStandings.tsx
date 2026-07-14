export default function GroupStandings({ championshipId }: { championshipId: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#111827]/40 p-6 text-center">
      <p className="text-sm text-slate-400">
        Fase de Grupos em desenvolvimento para o campeonato {championshipId}.
      </p>
    </div>
  );
}
