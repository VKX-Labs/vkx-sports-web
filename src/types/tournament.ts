export type TournamentType =
  | "PONTOS_CORRIDOS"
  | "MATA_MATA"
  | "GRUPOS_MATA_MATA"
  | "COPA"
  | "ELIMINATORIA_DUPLA";

export type PlayoffPhase =
  | "PRE_PLAYOFF"
  | "16_AVOS"
  | "OITAVAS"
  | "QUARTAS"
  | "SEMI"
  | "FINAL"
  | "TERCEIRO_LUGAR";

export interface KnockoutRules {
  two_legged: boolean;
  away_goals_rule: boolean;
  extra_time: boolean;
  penalties: boolean;
  third_place_match: boolean;
}

export interface PlayoffMatch {
  id: string;
  phase: PlayoffPhase;
  group_name: string | null;
  bracket_position: number;
  home_team: {
    id: string;
    name: string;
    badge_url: string | null;
  } | null;
  away_team: {
    id: string;
    name: string;
    badge_url: string | null;
  } | null;
  home_score: number | null;
  away_score: number | null;
  home_score_leg2: number | null;
  away_score_leg2: number | null;
  penalties_home: number | null;
  penalties_away: number | null;
  aggregate_home?: number;
  aggregate_away?: number;
  winner_id: string | null;
  is_finished: boolean;
}

export interface TeamStanding {
  position: number;
  team_id: string;
  team_name: string;
  badge_url: string | null;
  group_name: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  percentage: number;
}

export interface RoundFilterOption {
  label: string;
  value: string;
  category?: "GROUP" | "KNOCKOUT" | "SPLIT";
}

export interface MatchFilterConfig {
  type: TournamentType;
  currentPhase: string;
  options: RoundFilterOption[];
}
