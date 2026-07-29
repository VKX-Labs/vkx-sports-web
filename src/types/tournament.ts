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

export const PHASE_NAMES: Record<string, string> = {
  PRE_PLAYOFF: "Pré-Playoffs",
  "16_AVOS": "16 Avos de Final",
  OITAVAS: "Oitavas de Final",
  QUARTAS: "Quartas de Final",
  SEMI: "Semifinal",
  TERCEIRO_LUGAR: "3º Lugar",
  FINAL: "Final",
};

export const PHASE_ORDER: PlayoffPhase[] = [
  "PRE_PLAYOFF",
  "16_AVOS",
  "OITAVAS",
  "QUARTAS",
  "SEMI",
  "TERCEIRO_LUGAR",
  "FINAL",
];

export interface PhaseKnockoutRules {
  two_legged: boolean;
  away_goals_rule: boolean;
  extra_time: boolean;
  penalties: boolean;
}

export interface KnockoutRules {
  third_place_match: boolean;
  phases: Partial<Record<PlayoffPhase, PhaseKnockoutRules>>;
}

export function getDefaultPhaseRules(): PhaseKnockoutRules {
  return {
    two_legged: false,
    away_goals_rule: false,
    extra_time: false,
    penalties: true,
  };
}

export function getDefaultKnockoutRules(): KnockoutRules {
  return {
    third_place_match: false,
    phases: {},
  };
}

export function getPhaseRules(rules: KnockoutRules, phase: PlayoffPhase): PhaseKnockoutRules {
  return rules.phases[phase] ?? getDefaultPhaseRules();
}

export function isPhaseTwoLegged(rules: KnockoutRules, phase: PlayoffPhase): boolean {
  return getPhaseRules(rules, phase).two_legged;
}

export function migrateKnockoutRules(oldRules: Record<string, unknown>): KnockoutRules {
  if (oldRules.phases && typeof oldRules.phases === "object") {
    return oldRules as unknown as KnockoutRules;
  }

  const base: Partial<PhaseKnockoutRules> = {
    two_legged: Boolean(oldRules.two_legged),
    away_goals_rule: Boolean(oldRules.away_goals_rule),
    extra_time: Boolean(oldRules.extra_time),
    penalties: oldRules.penalties !== false,
  };

  return {
    third_place_match: Boolean(oldRules.third_place_match),
    phases: {},
    ...(base.two_legged ? { phases: {} } : {}),
  };
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
