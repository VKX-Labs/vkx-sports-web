"use client";

import React, { useState } from "react";
import { Shield, Trophy, Settings, X, Check } from "lucide-react";
import { PlayoffMatch, KnockoutRules } from "@/types/tournament";

interface BracketViewProps {
  matches: PlayoffMatch[];
  rules?: KnockoutRules;
  onUpdateRules?: (newRules: KnockoutRules) => void;
}

export function BracketView({
  matches,
  rules,
  onUpdateRules,
}: BracketViewProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const currentRules: KnockoutRules = rules || {
    two_legged: false,
    away_goals_rule: false,
    extra_time: false,
    penalties: true,
    third_place_match: false,
  };

  const [formRules, setFormRules] = useState<KnockoutRules>(currentRules);

  const defaultPhases = ["PRE_PLAYOFF", "OITAVAS", "QUARTAS", "SEMI", "FINAL"];
  
  const availablePhases = defaultPhases.filter((p) =>
    matches.some((m) => m.phase === p)
  );

  const phasesToRender = availablePhases.length > 0 ? availablePhases : defaultPhases;

  const handleSaveRules = () => {
    if (onUpdateRules) {
      onUpdateRules(formRules);
    }
    setIsConfigOpen(false);
  };

  return (
    <div className="w-full bg-zinc-900/80 rounded-xl border border-zinc-800/80 p-4 sm:p-6 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Chaveamento Eliminatório
            </h3>
            <p className="text-[11px] text-zinc-500">
              Formato:{" "}
              <span className="text-emerald-400 font-semibold">
                {currentRules.two_legged ? "Ida e Volta" : "Jogo Único"}
              </span>
              {currentRules.away_goals_rule && " • Gol fora ativo"}
            </p>
          </div>
        </div>

        {onUpdateRules && (
          <button
            onClick={() => {
              setFormRules(currentRules);
              setIsConfigOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all border border-zinc-700/80"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar Regras
          </button>
        )}
      </div>

      <div className="flex gap-8 min-w-[700px] justify-between items-start overflow-x-auto pb-2">
        {phasesToRender.map((phaseName) => {
          const phaseMatches = matches.filter((m) => m.phase === phaseName);
          if (phaseMatches.length === 0) return null;

          return (
            <div key={phaseName} className="flex-1 space-y-6 min-w-[220px]">
              <div className="text-center pb-2 border-b border-zinc-800">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  {phaseName === "PRE_PLAYOFF" ? "Pré-Playoffs" : phaseName}
                </span>
              </div>

              <div className="space-y-4">
                {phaseMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3 space-y-2 shadow-md relative hover:border-zinc-700 transition-all"
                  >
                    <div
                      className={`flex items-center justify-between text-xs font-medium p-1.5 rounded-lg transition-colors ${
                        match.winner_id === match.home_team?.id
                          ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30"
                          : "text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-4 h-4 bg-zinc-900 rounded p-0.5 flex items-center justify-center shrink-0 border border-zinc-800">
                          {match.home_team?.badge_url ? (
                            <img
                              src={match.home_team.badge_url}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Shield className="w-2.5 h-2.5 text-zinc-600" />
                          )}
                        </div>
                        <span className="truncate">
                          {match.home_team?.name || "A Definir"}
                        </span>
                      </div>
                      
                      <div className="font-mono text-xs font-bold px-1.5 flex items-center gap-1">
                        <span>{match.home_score ?? "-"}</span>
                        {currentRules.two_legged && (
                          <span className="text-zinc-500 text-[10px]">
                            ({match.home_score_leg2 ?? "-"})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/60" />

                    <div
                      className={`flex items-center justify-between text-xs font-medium p-1.5 rounded-lg transition-colors ${
                        match.winner_id === match.away_team?.id
                          ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30"
                          : "text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-4 h-4 bg-zinc-900 rounded p-0.5 flex items-center justify-center shrink-0 border border-zinc-800">
                          {match.away_team?.badge_url ? (
                            <img
                              src={match.away_team.badge_url}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Shield className="w-2.5 h-2.5 text-zinc-600" />
                          )}
                        </div>
                        <span className="truncate">
                          {match.away_team?.name || "A Definir"}
                        </span>
                      </div>

                      <div className="font-mono text-xs font-bold px-1.5 flex items-center gap-1">
                        <span>{match.away_score ?? "-"}</span>
                        {currentRules.two_legged && (
                          <span className="text-zinc-500 text-[10px]">
                            ({match.away_score_leg2 ?? "-"})
                          </span>
                        )}
                      </div>
                    </div>

                    {match.penalties_home !== null && match.penalties_away !== null && (
                      <div className="text-[10px] text-center text-amber-400 font-mono pt-1">
                        Pênaltis: {match.penalties_home} x {match.penalties_away}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Settings className="w-5 h-5" />
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                  Configurações do Mata-Mata
                </h3>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Formato Jogo Único x Ida e Volta */}
              <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Formato dos Confrontos</p>
                  <p className="text-[11px] text-zinc-500">Ida e Volta ou Jogo Único</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormRules((prev) => ({ ...prev, two_legged: !prev.two_legged }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    formRules.two_legged
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {formRules.two_legged ? "Ida e Volta" : "Jogo Único"}
                </button>
              </div>

              {formRules.two_legged && (
                <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Gol Fora de Casa</p>
                    <p className="text-[11px] text-zinc-500">Gols fora como desempate</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formRules.away_goals_rule}
                    onChange={(e) =>
                      setFormRules((prev) => ({
                        ...prev,
                        away_goals_rule: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Disputa de 3º Lugar</p>
                  <p className="text-[11px] text-zinc-500">Partida entre perdedores da semi</p>
                </div>
                <input
                  type="checkbox"
                  checked={formRules.third_place_match}
                  onChange={(e) =>
                    setFormRules((prev) => ({
                      ...prev,
                      third_place_match: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRules}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all"
              >
                <Check className="w-4 h-4" /> Salvar Regras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}