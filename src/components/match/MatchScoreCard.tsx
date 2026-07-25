import React from "react";
import { UserX } from "lucide-react";

interface MatchScoreCardProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  setHomeScore: (score: number | null) => void;
  setAwayScore: (score: number | null) => void;
  onDeclareWO: (winner: "home" | "away" | "double_wo") => void;
}

export function MatchScoreCard({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  setHomeScore,
  setAwayScore,
  onDeclareWO,
}: MatchScoreCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
        Placar da Partida
      </h2>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center space-y-2">
          <h3 className="font-bold text-white text-lg">{homeTeamName}</h3>
          <input
            type="number"
            min="0"
            value={homeScore ?? ""}
            onChange={(e) => setHomeScore(e.target.value === "" ? null : Number(e.target.value))}
            className="w-20 h-16 text-center text-2xl font-bold bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl focus:border-emerald-500 outline-none"
          />
        </div>

        <span className="text-2xl font-bold text-slate-600">:</span>

        <div className="flex-1 text-center space-y-2">
          <h3 className="font-bold text-white text-lg">{awayTeamName}</h3>
          <input
            type="number"
            min="0"
            value={awayScore ?? ""}
            onChange={(e) => setAwayScore(e.target.value === "" ? null : Number(e.target.value))}
            className="w-20 h-16 text-center text-2xl font-bold bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-slate-500 mr-2 flex items-center gap-1">
          <UserX className="w-3.5 h-3.5" /> Ausência / W.O:
        </span>
        <button
          onClick={() => onDeclareWO("home")}
          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
        >
          Vitória W.O. Mandante (3x0)
        </button>
        <button
          onClick={() => onDeclareWO("away")}
          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
        >
          Vitória W.O. Visitante (0x3)
        </button>
        <button
          onClick={() => onDeclareWO("double_wo")}
          className="px-2.5 py-1 text-xs bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded border border-red-900/50"
        >
          Duplo W.O. (Ambos Ausentes)
        </button>
      </div>
    </div>
  );
}