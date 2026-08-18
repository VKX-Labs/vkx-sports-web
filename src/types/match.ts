export type MatchStatus =
  | "scheduled"
  | "AGENDADO"
  | "EM_ANDAMENTO"
  | "finished"
  | "FINALIZADO"
  | "ADIADO"
  | "CANCELADO";

export interface Match {
  id: string;
  season_id: string;
  round_id: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  date: string | null;
  phase: string | null;
  bracket_position: number | null;
  external_match_id: string | null;
  next_match_id: string | null;
  winner_id: string | null;
  is_wo?: boolean | null;
  wo_type?: "home" | "away" | "double" | null;
  home_score_leg2: number | null;
  away_score_leg2: number | null;
  penalties_home: number | null;
  penalties_away: number | null;
  created_at?: string;
  home_team?: { id: string; name: string; badge_url: string | null };
  away_team?: { id: string; name: string; badge_url: string | null };
}

export interface MatchEventInput {
  match_id: string;
  player_id: string;
  team_id: string;
  type: "GOAL" | "ASSIST" | "YELLOW_CARD" | "RED_CARD" | "SAVE" | "TACKLE";
}
