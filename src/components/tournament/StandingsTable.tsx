import React, { useEffect, useState } from "react";
import { Maximize2, Shield, X } from "lucide-react";
import { TeamStanding } from "@/types/tournament";

interface StandingsTableProps {
  standings: TeamStanding[];
  title?: string;
}

interface StandingsTableContentProps {
  standings: TeamStanding[];
  fullscreen?: boolean;
}

export function StandingsTable({
  standings,
  title = "Tabela de Classificação",
}: StandingsTableProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFullscreen();
    };

    window.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  const handleTableClick = () => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      openFullscreen();
    }
  };

  return (
    <>
      <div className="w-full bg-zinc-900/80 rounded-xl border border-zinc-800/80 overflow-hidden backdrop-blur-md">
        <div className="p-3 sm:p-4 border-b border-zinc-800 flex items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider truncate">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-500 font-mono">{standings.length} equipes</span>
            <button
              type="button"
              onClick={openFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-700/80 hover:text-white transition-colors"
              aria-label="Expandir tabela em tela cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expandir</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={openFullscreen}
          className="md:hidden flex items-center gap-1.5 px-4 py-2 bg-emerald-500/5 border-b border-zinc-800/60 hover:bg-emerald-500/10 transition-colors w-full text-left"
          aria-label="Tocar para expandir e ver todas as estatísticas"
        >
          <span className="text-[10px] text-emerald-400/80 font-medium animate-pulse">→</span>
          <span className="text-[10px] text-zinc-500">Toque para expandir e ver todas as estatísticas</span>
        </button>

        <div
          className="relative cursor-pointer md:cursor-default"
          onClick={handleTableClick}
          role="button"
          aria-label="Tocar na tabela para expandir em tela cheia"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              handleTableClick();
            }
          }}
        >
          <StandingsTableContent standings={standings} />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-6 md:w-8 bg-gradient-to-l from-zinc-900 to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      {isFullscreen && (
        <FullscreenStandingsTable
          standings={standings}
          title={title}
          onClose={closeFullscreen}
        />
      )}
    </>
  );
}

function FullscreenStandingsTable({
  standings,
  title,
  onClose,
}: {
  standings: TeamStanding[];
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-zinc-900"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-3 p-4 border-b border-zinc-800 bg-zinc-900/95 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider truncate">{title}</h3>
          <span className="text-[11px] text-zinc-500 font-mono shrink-0">{standings.length} equipes</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 hover:bg-zinc-700/80 hover:text-white transition-colors shrink-0"
          aria-label="Fechar tabela"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <StandingsTableContent standings={standings} fullscreen />
      </div>
    </div>
  );
}

function StandingsTableContent({
  standings,
  fullscreen = false,
}: StandingsTableContentProps) {
  const cell = fullscreen ? "px-3 py-3" : "px-1 sm:px-3 py-2.5";
  const posWidth = fullscreen ? "w-10" : "w-8";
  const stickyLeft = fullscreen ? "left-10" : "left-8";
  const teamMinWidth = fullscreen ? "min-w-[170px]" : "min-w-[120px]";
  const badgeSize = fullscreen ? "w-6 h-6 text-xs" : "w-5 h-5 text-[10px]";
  const textSize = fullscreen ? "text-sm" : "text-xs";
  const headTextSize = fullscreen ? "text-[11px]" : "text-[10px]";
  const teamNameMax = fullscreen ? "max-w-[200px]" : "max-w-[110px]";
  const teamNameSize = fullscreen ? "text-sm" : "text-xs sm:text-sm";

  return (
    <div
      className="overflow-x-auto overflow-y-auto scroller-smooth w-full"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <table
        className={`w-full ${fullscreen ? "min-w-[640px]" : "min-w-[440px]"} text-left ${textSize} text-zinc-300`}
      >
        <thead
          className={`bg-zinc-950/60 text-zinc-400 uppercase font-mono tracking-wider border-b border-zinc-800/60 ${headTextSize}`}
        >
          <tr>
            <th className={`sticky left-0 z-20 bg-zinc-950 ${cell} text-center ${posWidth}`}>Pos</th>
            <th className={`sticky ${stickyLeft} z-20 bg-zinc-950 ${cell} ${teamMinWidth}`}>Equipe</th>
            <th className={`${cell} text-center font-bold text-emerald-400`}>P</th>
            <th className={`${cell} text-center`}>J</th>
            <th className={`${cell} text-center`}>V</th>
            <th className={`${cell} text-center`}>E</th>
            <th className={`${cell} text-center`}>D</th>
            <th className={`${cell} text-center`}>GP</th>
            <th className={`${cell} text-center`}>GC</th>
            <th className={`${cell} text-center`}>SG</th>
            <th className={`${cell} text-center`}>%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/40 font-medium">
          {standings.map((team) => {
            const isTop4 = team.position && team.position <= 4;

            return (
              <tr key={team.team_id} className="hover:bg-zinc-800/40 transition-colors group">
                <td className={`sticky left-0 z-10 bg-zinc-900 group-hover:bg-zinc-800/70 transition-colors ${cell} text-center font-mono font-bold`}>
                  <span
                    className={`inline-flex items-center justify-center rounded-md ${badgeSize} ${
                      isTop4
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "text-zinc-400"
                    }`}
                  >
                    {team.position}
                  </span>
                </td>

                <td className={`sticky ${stickyLeft} z-10 bg-zinc-900 group-hover:bg-zinc-800/70 transition-colors ${cell} font-semibold text-zinc-100 border-r border-zinc-800/60`}>
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
                    <span className={`truncate ${teamNameMax} ${teamNameSize}`}>
                      {team.team_name}
                    </span>
                  </div>
                </td>

                <td className={`${cell} text-center font-black text-emerald-400 font-mono bg-emerald-500/5`}>
                  {team.points}
                </td>
                <td className={`${cell} text-center font-mono text-zinc-300`}>{team.played}</td>
                <td className={`${cell} text-center font-mono text-zinc-400`}>{team.wins}</td>
                <td className={`${cell} text-center font-mono text-zinc-400`}>{team.draws}</td>
                <td className={`${cell} text-center font-mono text-zinc-400`}>{team.losses}</td>
                <td className={`${cell} text-center font-mono text-zinc-400`}>{team.goals_for}</td>
                <td className={`${cell} text-center font-mono text-zinc-400`}>{team.goals_against}</td>
                <td className={`${cell} text-center font-mono font-semibold`}>
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
                <td className={`${cell} text-center font-mono text-zinc-400`}>
                  {team.percentage}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
