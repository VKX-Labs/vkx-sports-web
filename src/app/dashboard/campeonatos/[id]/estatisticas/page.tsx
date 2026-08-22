"use client";

import { useEffect, useState, use } from "react";
import { LeaderboardCard } from "./components/LeaderboardCard";
import { StatisticsService, PlayerStat } from "@/services/StatisticsService";
import { Shield, Award, Square, Star, Medal } from "lucide-react";
import { supabase } from "@/lib/supabase";

type CategoryKey = "GOAL" | "ASSIST" | "SAVE" | "YELLOW_CARD" | "RED_CARD" | "RATING";

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: React.ReactNode;
  metricLabel: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: "GOAL", label: "Artilharia", icon: <Award className="w-4 h-4" />, metricLabel: "Gols" },
  { key: "ASSIST", label: "Assistências", icon: <Star className="w-4 h-4" />, metricLabel: "Passes" },
  { key: "SAVE", label: "Defesas", icon: <Shield className="w-4 h-4" />, metricLabel: "Defesas" },
  { key: "YELLOW_CARD", label: "Amarelos", icon: <Square className="w-4 h-4 text-yellow-400 fill-yellow-400" />, metricLabel: "Cartões" },
  { key: "RED_CARD", label: "Vermelhos", icon: <Square className="w-4 h-4 text-red-500 fill-red-500" />, metricLabel: "Cartões" },
  { key: "RATING", label: "Notas Médias", icon: <Medal className="w-4 h-4" />, metricLabel: "Nota" },
];

export default function EstatisticasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const championshipId = resolvedParams.id;

  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("GOAL");
  const [statsData, setStatsData] = useState<Record<CategoryKey, PlayerStat[]>>({
    GOAL: [],
    ASSIST: [],
    SAVE: [],
    YELLOW_CARD: [],
    RED_CARD: [],
    RATING: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveSeason() {
      const { data: season } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipId)
        .maybeSingle();

      setSeasonId(season?.id || championshipId);
    }

    if (championshipId) {
      resolveSeason();
    }
  }, [championshipId]);

  useEffect(() => {
    async function loadStats() {
      if (!seasonId) return;
      setLoading(true);

      const [goals, assists, saves, yellowCards, redCards, ratings] = await Promise.all([
        StatisticsService.getSeasonLeaderboard(seasonId, "GOAL"),
        StatisticsService.getSeasonLeaderboard(seasonId, "ASSIST"),
        StatisticsService.getSeasonLeaderboard(seasonId, "SAVE"),
        StatisticsService.getSeasonLeaderboard(seasonId, "YELLOW_CARD"),
        StatisticsService.getSeasonLeaderboard(seasonId, "RED_CARD"),
        StatisticsService.getSeasonRatingsLeaderboard(seasonId),
      ]);

      setStatsData({
        GOAL: goals,
        ASSIST: assists,
        SAVE: saves,
        YELLOW_CARD: yellowCards,
        RED_CARD: redCards,
        RATING: ratings,
      });
      setLoading(false);
    }

    loadStats();
  }, [seasonId]);

  const activeConfig = CATEGORIES.find((c) => c.key === activeCategory)!;
  const currentList = statsData[activeCategory] || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Líderes de Estatísticas</h1>
        <p className="text-sm text-gray-400">
          Selecione uma categoria para visualizar os melhores atletas do campeonato.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-semibold"
                  : "bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800">
          Carregando estatísticas...
        </div>
      ) : (
        <LeaderboardCard
          title={activeConfig.label}
          icon={activeConfig.icon}
          stats={currentList}
          metricLabel={activeConfig.metricLabel}
        />
      )}
    </div>
  );
}