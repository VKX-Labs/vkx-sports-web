import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { StandingsService } from "@/services/standingsService";
import type { Match } from "@/types/match";
import type { TeamStanding, PlayoffMatch, TournamentType } from "@/types/tournament";

export function useClassificacao(championshipId: string) {
  const [activeTab, setActiveTab] = useState<"table" | "bracket">("table");
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);
  const [tournamentType, setTournamentType] = useState<TournamentType>("PONTOS_CORRIDOS");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTournamentData() {
      if (!championshipId) return;
      setLoading(true);
      setError(null);

      try {
        const { data: seasonData, error: seasonErr } = await supabase
          .from("seasons")
          .select("id, tournament_type")
          .eq("championship_id", championshipId)
          .maybeSingle();

        if (seasonErr || !seasonData) {
          setStandings([]);
          setPlayoffMatches([]);
          setLoading(false);
          return;
        }

        const seasonId = seasonData.id;

        if (seasonData.tournament_type) {
          setTournamentType(seasonData.tournament_type as TournamentType);
        }

        const { data: teamsData, error: teamsErr } = await supabase
          .from("teams")
          .select("id, name, badge_url")
          .eq("season_id", seasonId);

        if (teamsErr) throw teamsErr;
        const teams = teamsData || [];

        const { data: allMatches, error: matchesErr } = await supabase
          .from("matches")
          .select("*")
          .eq("season_id", seasonId);

        if (matchesErr) throw matchesErr;

        const matchesList = (allMatches || []) as Match[];

        const calculated = StandingsService.calculateStandings(teams, matchesList);
        setStandings(calculated);

        const playoffList: PlayoffMatch[] = matchesList
          .filter((m) => m.phase && m.phase !== "REGULAR")
          .map((m) => {
            const home = teams.find((t) => t.id === m.home_team_id) || null;
            const away = teams.find((t) => t.id === m.away_team_id) || null;
            return {
              id: m.id,
              phase: m.phase as PlayoffMatch["phase"],
              group_name: null,
              bracket_position: m.bracket_position ?? 0,
              home_team: home,
              away_team: away,
              home_score: m.home_score,
              away_score: m.away_score,
              home_score_leg2: m.home_score_leg2 ?? null,
              away_score_leg2: m.away_score_leg2 ?? null,
              penalties_home: m.penalties_home ?? null,
              penalties_away: m.penalties_away ?? null,
              winner_id: m.winner_id ?? null,
              is_finished: m.status === "finished" || m.status === "FINALIZADO",
            };
          });

        setPlayoffMatches(playoffList);

        if (playoffList.length > 0 && calculated.every((s) => s.played === 0)) {
          setTournamentType("MATA_MATA");
          setActiveTab("bracket");
        }
      } catch {
        setError("Não foi possível carregar os dados da classificação.");
      } finally {
        setLoading(false);
      }
    }

    loadTournamentData();
  }, [championshipId]);

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    standings,
    playoffMatches,
    tournamentType,
    setTournamentType,
  };
}
