import type { Match } from "@/types/match";
import type { TeamStanding } from "@/types/tournament";

export const RoundRobinService = {
  calculateStandings(
    teams: { id: string; name: string; badge_url?: string; group_name?: string | null }[],
    matches: Pick<Match, "status" | "home_team_id" | "away_team_id" | "home_score" | "away_score">[]
  ): TeamStanding[] {
    const map = new Map<string, TeamStanding>();

    teams.forEach((t) => {
      map.set(t.id, {
        position: 0,
        team_id: t.id,
        team_name: t.name,
        badge_url: t.badge_url ?? null,
        group_name: t.group_name ?? null,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        percentage: 0,
      });
    });

    matches
      .filter((m) => {
        const status = (m.status || "").toLowerCase();
        return status === "finished" || status === "finalizado";
      })
      .forEach((m) => {
        const home = map.get(m.home_team_id);
        const away = map.get(m.away_team_id);

        if (!home || !away) return;

        const hScore = m.home_score ?? 0;
        const aScore = m.away_score ?? 0;

        home.played += 1;
        away.played += 1;
        home.goals_for += hScore;
        home.goals_against += aScore;
        away.goals_for += aScore;
        away.goals_against += hScore;

        if (hScore > aScore) {
          home.wins += 1;
          home.points += 3;
          away.losses += 1;
        } else if (aScore > hScore) {
          away.wins += 1;
          away.points += 3;
          home.losses += 1;
        } else {
          home.draws += 1;
          away.draws += 1;
          home.points += 1;
          away.points += 1;
        }
      });

    const standingsList = Array.from(map.values()).map((s) => {
      s.goal_difference = s.goals_for - s.goals_against;
      const maxPossiblePoints = s.played * 3;
      s.percentage =
        maxPossiblePoints > 0 ? Math.round((s.points / maxPossiblePoints) * 100) : 0;
      return s;
    });

    standingsList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
      return a.team_name.localeCompare(b.team_name);
    });

    return standingsList.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  },

  groupByGroups(standings: TeamStanding[]): Record<string, TeamStanding[]> {
    return standings.reduce((acc, team) => {
      const groupKey = team.group_name ? `Grupo ${team.group_name}` : "Geral";
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(team);
      return acc;
    }, {} as Record<string, TeamStanding[]>);
  },
};
