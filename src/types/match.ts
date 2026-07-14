export type MatchStatus = "AGENDADO" | "EM_ANDAMENTO" | "FINALIZADO" | "ADIADO" | "CANCELADO";

export interface Match {
  id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  round: number | null;
  date: string | null;
  status: MatchStatus;
  created_at: string;
}
