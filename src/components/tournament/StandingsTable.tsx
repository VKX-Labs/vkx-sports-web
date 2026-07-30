import React from "react";
import { Shield } from "lucide-react";
import { TeamStanding } from "@/types/tournament";

interface StandingsTableProps {
  standings: TeamStanding[];
  title?: string;
}

export function StandingsTable({
  standings,
  title = "Tabela de Classificação",
}: StandingsTableProps) {
  return (
    <div className="w-full bg-zinc-900/80 rounded-xl border border-zinc-800/80 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{title}</h3>
        <span className="text-[11px] text-zinc-500 font-mono">{standings.length} equipes</span>
      </div>

      <div className="overflow-x-auto scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full min-w-[550px] text-left text-xs text-zinc-300">
          <thead className="bg-zinc-950/60 text-[10px] text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800/60">
            <tr>
              <th className="py-2.5 px-3 text-center w-10">Pos</th>
              <th className="py-2.5 px-3">Equipe</th>
              <th className="py-2.5 px-2 text-center font-bold text-emerald-400">P</th>
              <th className="py-2.5 px-2 text-center">J</th>
              <th className="py-2.5 px-2 text-center">V</th>
              <th className="py-2.5 px-2 text-center">E</th>
              <th className="py-2.5 px-2 text-center">D</th>
              <th className="py-2.5 px-2 text-center">GP</th>
              <th className="py-2.5 px-2 text-center">GC</th>
              <th className="py-2.5 px-2 text-center">SG</th>
              <th className="py-2.5 px-3 text-center">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40 font-medium">
            {standings.map((team) => {
              const isTop4 = team.position && team.position <= 4;

              return (
                <tr key={team.team_id} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="py-2.5 px-3 text-center font-mono text-xs font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-md text-[10px] md:text-xs ${
                        isTop4
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-zinc-400"
                      }`}
                    >
                      {team.position}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-semibold text-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 bg-zinc-950 rounded border border-zinc-800 p-0.5 flex items-center justify-center shrink-0">
                        {team.badge_url ? (
                          <img
                            src={team.badge_url}
                            alt={team.team_name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Shield className="w-3.5 h-3.5 text-zinc-600" />
                        )}
                      </div>
                      <span className="truncate max-w-[100px] sm:max-w-none text-xs md:text-sm">
                        {team.team_name}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-2 text-center font-black text-emerald-400 font-mono text-sm bg-emerald-500/5">
                    {team.points}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono text-zinc-300">{team.played}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-zinc-400">{team.wins}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-zinc-400">{team.draws}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-zinc-400">{team.losses}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-zinc-400">{team.goals_for}</td>
                  <td className="py-2.5 px-2 text-center font-mono text-zinc-400">{team.goals_against}</td>
                  <td className="py-2.5 px-2 text-center font-mono font-semibold">
                    <span
                      className={
                        team.goal_difference > 0
                          ? "text-emerald-400"
                          : team.goal_difference < 0
                          ? "text-red-400"
                          : "text-zinc-500"
                      }
                    >
                      {team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-xs text-zinc-400">
                    {team.percentage}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}