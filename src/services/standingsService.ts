import type { Match } from "@/types/match";
import type { TeamStanding, PlayoffMatch } from "@/types/tournament";
import { RoundRobinService } from "./roundRobin.service";

export const PLAYOFF_PHASES = [
  "PRE_PLAYOFF",
  "16_AVOS",
  "OITAVAS",
  "QUARTAS",
  "SEMI",
  "FINAL",
  "TERCEIRO_LUGAR",
] as const;

export type PlayoffPhase = (typeof PLAYOFF_PHASES)[number];

export const StandingsService = {
  calculateStandings(
    teams: { id: string; name: string; badge_url?: string; group_name?: string | null }[],
    matches: Pick<Match, "status" | "home_team_id" | "away_team_id" | "home_score" | "away_score">[]
  ): TeamStanding[] {
    return RoundRobinService.calculateStandings(teams, matches);
  },

  groupByGroups(standings: TeamStanding[]): Record<string, TeamStanding[]> {
    return RoundRobinService.groupByGroups(standings);
  },

  filterPlayoffMatches(matches: PlayoffMatch[]): PlayoffMatch[] {
    return matches.filter((m) => PLAYOFF_PHASES.includes(m.phase as PlayoffPhase));
  },
};
