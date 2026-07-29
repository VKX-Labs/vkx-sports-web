import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { MatchRepository } from "@/repositories/match.repository";
import { StandingsService } from "@/services/standingsService";
import type { Match } from "@/types/match";
import type { TeamStanding, PlayoffMatch, TournamentType, KnockoutRules } from "@/types/tournament";
import { getDefaultKnockoutRules, migrateKnockoutRules } from "@/types/tournament";

export function useClassificacao(championshipId: string) {
  const [activeTab, setActiveTab] = useState<"table" | "bracket">("table");
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);
  const [tournamentType, setTournamentType] = useState<TournamentType>("PONTOS_CORRIDOS");
  const [knockoutRules, setKnockoutRules] = useState<KnockoutRules>(getDefaultKnockoutRules());
  const [error, setError] = useState<string | null>(null);

  const loadTournamentData = useCallback(async () => {
    if (!championshipId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: seasonData, error: seasonErr } = await supabase
        .from("seasons")
        .select("id, tournament_type, rules")
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

      if (seasonData.rules) {
        const migrated = migrateKnockoutRules(seasonData.rules as Record<string, unknown>);
        setKnockoutRules(migrated);
      }

      let teams: any[] = [];
      const { data: seasonTeams } = await supabase
        .from("teams")
        .select("id, name, badge_url")
        .eq("season_id", seasonId);

      if (seasonTeams && seasonTeams.length > 0) {
        teams = seasonTeams;
      } else {
        const { data: champTeams } = await supabase
          .from("teams")
          .select("id, name, badge_url")
          .eq("championship_id", championshipId);
        teams = champTeams || [];
      }

      let matchesList: Match[] = [];
      const { data: matchesWithJoin, error: joinErr } = await supabase
        .from("matches")
        .select(`
          *,
          home_team:teams!home_team_id(id, name, badge_url),
          away_team:teams!away_team_id(id, name, badge_url)
        `)
        .eq("season_id", seasonId);

      if (!joinErr && matchesWithJoin) {
        matchesList = matchesWithJoin as Match[];
      } else {
        const { data: simpleMatches } = await supabase
          .from("matches")
          .select("*")
          .eq("season_id", seasonId);

        const teamMap = new Map(teams.map((t) => [t.id, t]));

        matchesList = (simpleMatches || []).map((m: any) => ({
          ...m,
          home_team: teamMap.get(m.home_team_id) || null,
          away_team: teamMap.get(m.away_team_id) || null,
        })) as Match[];
      }

      if (teams.length > 0) {
        const calculated = StandingsService.calculateStandings(teams, matchesList);
        setStandings(calculated);
      } else {
        setStandings([]);
      }

      let playoffList: PlayoffMatch[] = [];

      try {
        const playoffData = await MatchRepository.getPlayoffMatches(seasonId);

        if (playoffData && playoffData.length > 0) {
          playoffList = playoffData.map((m) => ({
            id: m.id,
            phase: (m.phase || "PRE_PLAYOFF") as PlayoffMatch["phase"],
            group_name: null,
            bracket_position: m.bracket_position ?? 0,
            home_team: m.home_team ?? null,
            away_team: m.away_team ?? null,
            home_score: m.home_score,
            away_score: m.away_score,
            home_score_leg2: m.home_score_leg2 ?? null,
            away_score_leg2: m.away_score_leg2 ?? null,
            penalties_home: m.penalties_home ?? null,
            penalties_away: m.penalties_away ?? null,
            winner_id: m.winner_id ?? null,
            is_finished: m.status === "finished" || m.status === "FINALIZADO",
          }));
        }
      } catch (err) {
        console.warn("MatchRepository.getPlayoffMatches falhou, utilizando extração da lista geral:", err);
      }

      if (playoffList.length === 0) {
        playoffList = matchesList
          .filter(
            (m) =>
              m.phase !== null &&
              m.phase !== undefined &&
              m.phase !== "REGULAR"
          )
          .map((m) => ({
            id: m.id,
            phase: (m.phase || "PRE_PLAYOFF") as PlayoffMatch["phase"],
            group_name: null,
            bracket_position: (m as unknown as Record<string, unknown>).bracket_position as number ?? 0,
            home_team: m.home_team ?? null,
            away_team: m.away_team ?? null,
            home_score: m.home_score,
            away_score: m.away_score,
            home_score_leg2: (m as unknown as Record<string, unknown>).home_score_leg2 as number ?? null,
            away_score_leg2: (m as unknown as Record<string, unknown>).away_score_leg2 as number ?? null,
            penalties_home: (m as unknown as Record<string, unknown>).penalties_home as number ?? null,
            penalties_away: (m as unknown as Record<string, unknown>).penalties_away as number ?? null,
            winner_id: (m as unknown as Record<string, unknown>).winner_id as string ?? null,
            is_finished: m.status === "finished" || m.status === "FINALIZADO",
          }));
      }

      setPlayoffMatches(playoffList);

      if (
        seasonData.tournament_type === "MATA_MATA" || 
        (playoffList.length > 0 && standings.every((s) => s.played === 0))
      ) {
        setTournamentType("MATA_MATA");
        setActiveTab("bracket");
      } else {
        setActiveTab("table");
      }
    } catch (err) {
      console.error("Erro ao carregar dados da classificação:", err);
      setError("Não foi possível carregar os dados da classificação.");
    } finally {
      setLoading(false);
    }
  }, [championshipId]);

  useEffect(() => {
    loadTournamentData();
  }, [loadTournamentData]);

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    standings,
    playoffMatches,
    tournamentType,
    setTournamentType,
    knockoutRules,
    setKnockoutRules,
    loadTournamentData,
  };
}