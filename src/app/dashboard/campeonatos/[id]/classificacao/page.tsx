"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useClassificacao } from "@/hooks/useClassificacao";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsService } from "@/services/standingsService";
import { TournamentType, KnockoutRules } from "@/types/tournament";
import { Table, Trophy, Loader2, Settings2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ClassificacaoPage() {
  const params = useParams();
  const championshipId = params?.id as string;

  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    standings,
    playoffMatches,
    tournamentType,
    setTournamentType,
  } = useClassificacao(championshipId);

  const [knockoutRules, setKnockoutRules] = useState<KnockoutRules>({
    two_legged: false,
    away_goals_rule: false,
    extra_time: false,
    penalties: true,
    third_place_match: false,
  });

  const normalizedTournamentType = (
    tournamentType || "PONTOS_CORRIDOS"
  )
    .toUpperCase()
    .replace(/-/g, "_") as TournamentType;

  const handleTournamentTypeChange = async (newType: TournamentType) => {
    setTournamentType(newType);

    if (newType === "MATA_MATA") {
      setActiveTab("bracket");
    } else {
      setActiveTab("table");
    }

    try {
      const { data: seasonData } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .maybeSingle();

      if (seasonData?.id) {
        const formattedType = newType.toLowerCase().replace(/_/g, "-");
        await supabase
          .from("seasons")
          .update({ tournament_type: formattedType })
          .eq("id", seasonData.id);
      }
    } catch (err) {
      console.error("Erro ao atualizar o tipo do torneio na temporada:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs font-mono">Carregando equipes e pontuação...</span>
      </div>
    );
  }

  const isOnlyKnockout = normalizedTournamentType === "MATA_MATA";
  const effectiveTab = isOnlyKnockout ? "bracket" : activeTab;

  const isGroupFormat =
    normalizedTournamentType === "GRUPOS_MATA_MATA" ||
    normalizedTournamentType === "COPA";

  const groupedStandings = isGroupFormat
    ? StandingsService.groupByGroups?.(standings)
    : null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          {!isOnlyKnockout && (
            <button
              type="button"
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                effectiveTab === "table"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <Table className="w-4 h-4" />
              {isGroupFormat ? "Fase de Grupos" : "Pontos Corridos"}
            </button>
          )}

          {(playoffMatches.length > 0 || isOnlyKnockout) && (
            <button
              type="button"
              onClick={() => setActiveTab("bracket")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                effectiveTab === "bracket"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <Trophy className="w-4 h-4" /> Mata-Mata / Chaveamento
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 border border-zinc-800 rounded-xl self-start sm:self-auto">
          <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={normalizedTournamentType}
            onChange={(e) =>
              handleTournamentTypeChange(e.target.value as TournamentType)
            }
            className="bg-transparent text-xs text-zinc-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="PONTOS_CORRIDOS" className="bg-zinc-900 text-zinc-200">
              Pontos Corridos
            </option>
            <option value="GRUPOS_MATA_MATA" className="bg-zinc-900 text-zinc-200">
              Fase de Grupos
            </option>
            <option value="COPA" className="bg-zinc-900 text-zinc-200">
              Formato Copa
            </option>
            <option value="MATA_MATA" className="bg-zinc-900 text-zinc-200">
              Apenas Mata-Mata
            </option>
          </select>
        </div>
      </div>

      {effectiveTab === "table" ? (
        isGroupFormat && groupedStandings ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(groupedStandings).map(([groupTitle, groupData]) => (
              <div key={groupTitle} className="space-y-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">
                  {groupTitle}
                </h3>
                <StandingsTable standings={groupData} />
              </div>
            ))}
          </div>
        ) : (
          <StandingsTable standings={standings} />
        )
      ) : (
        <BracketView
          matches={playoffMatches}
          rules={knockoutRules}
          onUpdateRules={(newRules) => setKnockoutRules(newRules)}
        />
      )}
    </div>
  );
}
