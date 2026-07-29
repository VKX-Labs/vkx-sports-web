"use client";

import React, { useState, useMemo } from "react";
import { Shield, Trophy, Settings } from "lucide-react";
import {
  PlayoffMatch,
  KnockoutRules,
  PlayoffPhase,
  PHASE_ORDER,
  PHASE_NAMES,
  getPhaseRules,
  isPhaseTwoLegged,
  getDefaultKnockoutRules,
} from "@/types/tournament";
import { KnockoutService } from "@/services/knockout.service";
import { KnockoutConfigModal } from "./KnockoutRulesModal";

interface BracketViewProps {
  matches: PlayoffMatch[];
  rules?: KnockoutRules;
  onUpdateRules?: (newRules: KnockoutRules) => void;
}

function TeamRow({
  team,
  isWinner,
  score,
  scoreLeg2,
  isTwoLegged,
}: {
  team?: PlayoffMatch["home_team"];
  isWinner: boolean;
  score?: number | null;
  scoreLeg2?: number | null;
  isTwoLegged: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between text-xs font-medium p-1.5 rounded-lg transition-colors ${
        isWinner
          ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30"
          : "text-zinc-200"
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        <div className="w-4 h-4 bg-zinc-900 rounded p-0.5 flex items-center justify-center shrink-0 border border-zinc-800">
          {team?.badge_url ? (
            <img
              src={team.badge_url}
              alt={team.name || "Badge"}
              className="w-full h-full object-contain"
            />
          ) : (
            <Shield className="w-2.5 h-2.5 text-zinc-600" />
          )}
        </div>
        <span className="truncate">{team?.name || "A Definir"}</span>
      </div>

      <div className="font-mono text-xs font-bold px-1.5 flex items-center gap-1">
        <span>{score ?? "-"}</span>
        {isTwoLegged && (
          <span className="text-zinc-500 text-[10px]">
            ({scoreLeg2 ?? "-"})
          </span>
        )}
      </div>
    </div>
  );
}

export function BracketView({ matches, rules, onUpdateRules }: BracketViewProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const currentRules = useMemo(() => rules ?? getDefaultKnockoutRules(), [rules]);

  const activePhases = useMemo(() => {
    const presentPhases = PHASE_ORDER.filter((phase) =>
      matches.some((m) => m.phase === phase)
    );
    return presentPhases.length > 0 ? presentPhases : PHASE_ORDER;
  }, [matches]);

  const activePhasesList = useMemo(() => {
    return activePhases.filter((p) => matches.some((m) => m.phase === p));
  }, [activePhases, matches]);

  const allPhasesTwoLegged = useMemo(() => {
    return activePhasesList.every((p) =>
      isPhaseTwoLegged(currentRules, p as PlayoffPhase)
    );
  }, [currentRules, activePhasesList]);

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
                {allPhasesTwoLegged
                  ? "Ida e Volta"
                  : activePhasesList.some((p) =>
                      isPhaseTwoLegged(currentRules, p as PlayoffPhase)
                    )
                  ? "Misto (Jogo Único + Ida e Volta)"
                  : "Jogo Único"}
              </span>
            </p>
          </div>
        </div>

        {onUpdateRules && (
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-all border border-zinc-700/80"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar Regras
          </button>
        )}
      </div>

      <div className="flex gap-6 min-w-[750px] justify-between items-stretch overflow-x-auto pb-4">
        {activePhasesList.map((phaseName) => {
          const phaseMatches = matches.filter((m) => m.phase === phaseName);
          if (phaseMatches.length === 0) return null;

          const phaseRules = getPhaseRules(currentRules, phaseName as PlayoffPhase);
          const isTwoLegged = phaseRules.two_legged;
          const legPairs = KnockoutService.createLegPairs(
            phaseMatches.map((m) => ({
              phase: m.phase,
              bracket_position: m.bracket_position,
            }))
          );

          return (
            <div key={phaseName} className="flex-1 flex flex-col min-w-[220px]">
              <div className="text-center pb-3 border-b border-zinc-800 mb-4">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  {PHASE_NAMES[phaseName] || phaseName}
                </span>
                {isTwoLegged && (
                  <span className="ml-2 text-[9px] text-emerald-500 font-mono">
                    Ida e Volta
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-around gap-4">
                {legPairs.map((pair, pairIdx) => {
                  const match1 = phaseMatches[pair.leg1];
                  const match2 = pair.leg2 != null ? phaseMatches[pair.leg2] : null;

                  const winnerId = KnockoutService.determineWinnerId(
                    match1,
                    phaseName as PlayoffPhase,
                    currentRules
                  );

                  const isHomeWinner =
                    Boolean(winnerId) && winnerId === match1.home_team?.id;
                  const isAwayWinner =
                    Boolean(winnerId) && winnerId === match1.away_team?.id;

                  const hasPenalties =
                    match1.penalties_home != null && match1.penalties_away != null;

                  const aggregateDisplay = isTwoLegged
                    ? KnockoutService.getAggregateDisplay(
                        match1,
                        phaseName as PlayoffPhase,
                        currentRules
                      )
                    : null;

                  return (
                    <div
                      key={`${match1.id}-${pairIdx}`}
                      className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-3 space-y-2 shadow-md relative hover:border-zinc-700 transition-all"
                    >
                      <TeamRow
                        team={match1.home_team}
                        isWinner={isHomeWinner}
                        score={match1.home_score}
                        scoreLeg2={match2?.away_score ?? null}
                        isTwoLegged={isTwoLegged}
                      />

                      <div className="border-t border-zinc-800/60" />

                      <TeamRow
                        team={match1.away_team}
                        isWinner={isAwayWinner}
                        score={match1.away_score}
                        scoreLeg2={match2?.home_score ?? null}
                        isTwoLegged={isTwoLegged}
                      />

                      {aggregateDisplay && (
                        <div className="text-[10px] text-center text-zinc-400 font-mono pt-1 border-t border-zinc-800/40">
                          Agregado: {aggregateDisplay.homeTotal} x{" "}
                          {aggregateDisplay.awayTotal}
                        </div>
                      )}

                      {hasPenalties && (
                        <div className="text-[10px] text-center text-amber-400 font-mono pt-1">
                          Pênaltis: {match1.penalties_home} x {match1.penalties_away}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <KnockoutConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        rules={currentRules}
        onSaveRules={(newRules) => {
          onUpdateRules?.(newRules);
          setIsConfigOpen(false);
        }}
        activePhases={activePhasesList as PlayoffPhase[]}
      />
    </div>
  );
}
