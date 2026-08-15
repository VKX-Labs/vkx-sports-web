import { StatisticsRepository } from "@/repositories/StatisticsRepository";

export interface PlayerStat {
  player_id: string;
  player_name: string;
  player_photo: string | null;
  team_name: string;
  team_badge: string | null;
  count: number;
}

export class StatisticsService {
  private static normalizeEventType(type: string): { dbType: string; metricKey: string } {
    const normalized = type.toUpperCase().trim();

    if (normalized.includes("YELLOW") || normalized.includes("AMAREL")) {
      return { dbType: "YELLOW_CARD", metricKey: "total_yellow_cards" };
    }
    if (normalized.includes("RED") || normalized.includes("VERMELH")) {
      return { dbType: "RED_CARD", metricKey: "total_red_cards" };
    }
    if (normalized.includes("GOAL") || normalized.includes("GOL") || normalized.includes("ARTILHARIA")) {
      return { dbType: "GOAL", metricKey: "total_goals" };
    }
    if (normalized.includes("ASSIST") || normalized.includes("PASSE")) {
      return { dbType: "ASSIST", metricKey: "total_assists" };
    }
    if (normalized.includes("SAVE") || normalized.includes("DEFESA")) {
      return { dbType: "SAVE", metricKey: "total_saves" };
    }
    if (normalized.includes("TACKLE") || normalized.includes("DESARME")) {
      return { dbType: "TACKLE", metricKey: "total_tackles" };
    }

    return { dbType: normalized, metricKey: "total_goals" };
  }

  private static mapFromView(data: any[], metricKey: string): PlayerStat[] {
    if (!Array.isArray(data) || data.length === 0) return [];

    const list: PlayerStat[] = [];

    for (const row of data) {
      const player = row.players || row.player || row;
      const team = player.teams || row.teams || row.team;

      const countValue = Number(row[metricKey] ?? player[metricKey] ?? 0);

      if (countValue > 0) {
        list.push({
          player_id: row.player_id || player.id || player.player_id,
          player_name: player.name || player.player_name || "Jogador sem nome",
          player_photo: player.photo_url || player.player_photo || null,
          team_name: team?.name || row.team_name || "Sem time",
          team_badge: team?.badge_url || row.team_badge || null,
          count: countValue,
        });
      }
    }

    return list.sort((a, b) => b.count - a.count);
  }

  private static processEvents(events: any[], isAssistType = false): PlayerStat[] {
    if (!Array.isArray(events) || events.length === 0) return [];

    const statsMap = new Map<string, PlayerStat>();

    for (const item of events) {
      let targetPlayer = item.players;
      let targetPlayerId = item.player_id;

      if (isAssistType && (item.assist_player_id || item.assist_player)) {
        targetPlayer = item.assist_player;
        targetPlayerId = item.assist_player_id;
      }

      if (!targetPlayer || !targetPlayerId) continue;

      const team = targetPlayer.teams;

      if (!statsMap.has(targetPlayerId)) {
        statsMap.set(targetPlayerId, {
          player_id: targetPlayerId,
          player_name: targetPlayer.name || "Jogador sem nome",
          player_photo: targetPlayer.photo_url || null,
          team_name: team?.name || "Sem time",
          team_badge: team?.badge_url || null,
          count: 0,
        });
      }

      const currentStat = statsMap.get(targetPlayerId)!;
      currentStat.count += 1;
    }

    return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
  }

  static async getSeasonLeaderboard(
    seasonId: string,
    eventType?: string,
    limit = 10
  ): Promise<PlayerStat[] | any> {
    if (eventType) {
      const { dbType, metricKey } = this.normalizeEventType(eventType);
      const isAssist = dbType === "ASSIST";

      let rawData = await StatisticsRepository.getMatchEventsBySeason(seasonId, dbType);

      if (!rawData || rawData.length === 0) {
        if (dbType === "YELLOW_CARD") {
          rawData = await StatisticsRepository.getMatchEventsBySeason(seasonId, "YELLOW");
        } else if (dbType === "RED_CARD") {
          rawData = await StatisticsRepository.getMatchEventsBySeason(seasonId, "RED");
        }
      }

      const viewResult = this.mapFromView(rawData, metricKey);
      if (viewResult.length > 0) {
        return viewResult.slice(0, limit);
      }

      const eventsResult = this.processEvents(rawData, isAssist);
      return eventsResult.slice(0, limit);
    }

    const [goals, assists, yellowCards, redCards, saves, tackles] = await Promise.all([
      StatisticsRepository.getMatchEventsBySeason(seasonId, "GOAL"),
      StatisticsRepository.getMatchEventsBySeason(seasonId, "ASSIST"),
      StatisticsRepository.getMatchEventsBySeason(seasonId, "YELLOW_CARD"),
      StatisticsRepository.getMatchEventsBySeason(seasonId, "RED_CARD"),
      StatisticsRepository.getMatchEventsBySeason(seasonId, "SAVE"),
      StatisticsRepository.getMatchEventsBySeason(seasonId, "TACKLE"),
    ]);

    return {
      topScorers: this.processEvents(goals).slice(0, limit),
      topAssists: this.processEvents(assists, true).slice(0, limit),
      topYellowCards: this.processEvents(yellowCards).slice(0, limit),
      topRedCards: this.processEvents(redCards).slice(0, limit),
      topSaves: this.processEvents(saves).slice(0, limit),
      topTackles: this.processEvents(tackles).slice(0, limit),
    };
  }
}