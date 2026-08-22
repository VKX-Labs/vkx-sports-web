"use client";

import { useEffect, useState } from "react";
import { Award, Star, Hand, Square, Medal, Loader2 } from "lucide-react";
import { StatisticsService, PlayerStat } from "@/services/StatisticsService";
import { LeaderboardCard } from "@/app/dashboard/campeonatos/[id]/estatisticas/components/LeaderboardCard";
import { usePublicChampionshipContext } from "@/app/(public)/[championshipSlug]/championship-context";

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
  { key: "SAVE", label: "Defesas", icon: <Hand className="w-4 h-4" />, metricLabel: "Defesas" },
  { key: "YELLOW_CARD", label: "Amarelos", icon: <Square className="w-4 h-4 text-yellow-400 fill-yellow-400" />, metricLabel: "Cartões" },
  { key: "RED_CARD", label: "Vermelhos", icon: <Square className="w-4 h-4 text-red-500 fill-red-500" />, metricLabel: "Cartões" },
  { key: "RATING", label: "Notas Médias", icon: <Medal className="w-4 h-4" />, metricLabel: "Nota" },
];

export default function PublicChampionshipStatsPage() {
  const { championship, seasonId } = usePublicChampionshipContext();

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
    let active = true;

    async function loadStats() {
      if (!seasonId) {
        setLoading(false);
        return;
      }

      try {
        const [goals, assists, saves, yellowCards, redCards, ratings] = await Promise.all([
          StatisticsService.getSeasonLeaderboard(seasonId, "GOAL"),
          StatisticsService.getSeasonLeaderboard(seasonId, "ASSIST"),
          StatisticsService.getSeasonLeaderboard(seasonId, "SAVE"),
          StatisticsService.getSeasonLeaderboard(seasonId, "YELLOW_CARD"),
          StatisticsService.getSeasonLeaderboard(seasonId, "RED_CARD"),
          StatisticsService.getSeasonRatingsLeaderboard(seasonId),
        ]);

        if (active) {
          setStatsData({
            GOAL: goals,
            ASSIST: assists,
            SAVE: saves,
            YELLOW_CARD: yellowCards,
            RED_CARD: redCards,
            RATING: ratings,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar estatísticas públicas:", err);
        if (active)
          setStatsData({
            GOAL: [],
            ASSIST: [],
            SAVE: [],
            YELLOW_CARD: [],
            RED_CARD: [],
            RATING: [],
          });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [seasonId]);

  if (!championship) return null;

  const activeConfig = CATEGORIES.find((c) => c.key === activeCategory) as CategoryConfig;
  const currentList = statsData[activeCategory] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">
          Líderes de Estatísticas
        </h1>
        <p className="text-xs text-slate-400">
          Melhores atletas do campeonato por categoria.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-semibold"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono">Carregando estatísticas...</span>
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
