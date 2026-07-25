
export type MatchStatus = "AGENDADO" | "EM_ANDAMENTO" | "FINALIZADO" | "ADIADO" | "CANCELADO";

export interface Match {
  id: string;
  round_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  date: string | null;
  created_at?: string;
  home_team?: { id: string; name: string; badge_url: string | null };
  away_team?: { id: string; name: string; badge_url: string | null };
}

export interface MatchEventInput {
  match_id: string;
  player_id: string;
  team_id: string;
  event_type: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD" | "SAVE";
}