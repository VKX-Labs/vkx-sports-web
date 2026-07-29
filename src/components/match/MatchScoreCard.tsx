import React, { useState } from "react";
import { Shield, AlertCircle, ChevronDown } from "lucide-react";

interface TeamData {
  id?: string;
  name?: string;
  badge_url?: string;
}

interface MatchScoreCardProps {
  homeTeam: TeamData | string | null;
  awayTeam: TeamData | string | null;
  homeScore: number | null;
  awayScore: number | null;
  setHomeScore: (score: number | null) => void;
  setAwayScore: (score: number | null) => void;
  onDeclareWO: (winner: "home" | "away" | "double_wo") => void;
}

export function MatchScoreCard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  setHomeScore,
  setAwayScore,
  onDeclareWO,
}: MatchScoreCardProps) {
  const [showWoMenu, setShowWoMenu] = useState(false);
  const [homeImgError, setHomeImgError] = useState(false);
  const [awayImgError, setAwayImgError] = useState(false);

  const homeName = typeof homeTeam === "string" ? homeTeam : homeTeam?.name || "Mandante";
  const awayName = typeof awayTeam === "string" ? awayTeam : awayTeam?.name || "Visitante";

  const homeBadge = typeof homeTeam === "object" ? homeTeam?.badge_url : null;
  const awayBadge = typeof awayTeam === "object" ? awayTeam?.badge_url : null;

  return (
    <div className="w-full space-y-2">
      <div className="relative overflow-hidden bg-zinc-900/90 rounded-xl border border-zinc-800 p-3 sm:p-4 shadow-lg">
        
        <div className="relative z-10 flex justify-center mb-2">
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold tracking-wider px-2.5 py-0.5 rounded-full uppercase">
            MATCH CENTER • SÚMULA OFICIAL
          </span>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-2 max-w-3xl mx-auto">
          
          <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 truncate text-right">
              {homeName}
            </h2>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-950 rounded-lg border border-zinc-800/80 p-1.5 flex items-center justify-center shrink-0">
              {homeBadge && !homeImgError ? (
                <img
                  src={homeBadge}
                  alt={homeName}
                  onError={() => setHomeImgError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Shield className="w-5 h-5 text-zinc-600" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800 shrink-0">
            <input
              type="number"
              min="0"
              value={homeScore ?? ""}
              onChange={(e) => setHomeScore(e.target.value === "" ? null : Number(e.target.value))}
              className="w-10 md:w-10 text-center text-xl sm:text-2xl font-black font-mono text-zinc-100 bg-transparent focus:outline-none focus:text-emerald-400 py-2.5 md:py-0"
              placeholder="0"
            />
            <span className="text-zinc-600 font-bold text-sm select-none">:</span>
            <input
              type="number"
              min="0"
              value={awayScore ?? ""}
              onChange={(e) => setAwayScore(e.target.value === "" ? null : Number(e.target.value))}
              className="w-10 md:w-10 text-center text-xl sm:text-2xl font-black font-mono text-zinc-100 bg-transparent focus:outline-none focus:text-emerald-400 py-2.5 md:py-0"
              placeholder="0"
            />
          </div>

          <div className="flex items-center justify-start gap-2.5 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-950 rounded-lg border border-zinc-800/80 p-1.5 flex items-center justify-center shrink-0">
              {awayBadge && !awayImgError ? (
                <img
                  src={awayBadge}
                  alt={awayName}
                  onError={() => setAwayImgError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Shield className="w-5 h-5 text-zinc-600" />
              )}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 truncate text-left">
              {awayName}
            </h2>
          </div>

        </div>
      </div>

      <div className="flex justify-end relative">
        <button
          type="button"
          onClick={() => setShowWoMenu(!showWoMenu)}
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 py-0.5 px-2 rounded hover:bg-zinc-900"
        >
          <AlertCircle className="w-3 h-3" />
          <span>Atribuir W.O. (Exceção)</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showWoMenu && (
          <div className="absolute right-0 top-6 z-30 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1 space-y-1">
            <button
              onClick={() => { onDeclareWO("home"); setShowWoMenu(false); }}
              className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded"
            >
              Vitória Mandante (3x0)
            </button>
            <button
              onClick={() => { onDeclareWO("away"); setShowWoMenu(false); }}
              className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 rounded"
            >
              Vitória Visitante (0x3)
            </button>
            <button
              onClick={() => { onDeclareWO("double_wo"); setShowWoMenu(false); }}
              className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded"
            >
              Duplo W.O.
            </button>
          </div>
        )}
      </div>
    </div>
  );
}