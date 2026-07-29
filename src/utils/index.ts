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

export interface Season {
  id: string;
  name: string;
  status: "CONFIGURACAO" | "INSCRICOES" | "SORTEIO" | "ANDAMENTO" | "FINALIZADO";
  modality: string;
  city: string | null;
  state: string | null;
  tournament_type: TournamentType;
  max_teams: number | null;
}

export interface Championship {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  created_at?: string;
  seasons: Season[];
}

export function normalizeTournamentType(type?: string | null): TournamentType {
  if (!type) return "PONTOS_CORRIDOS";

  const clean = type.toUpperCase().replace(/-/g, "_").trim();

  const validTypes: TournamentType[] = [
    "PONTOS_CORRIDOS",
    "MATA_MATA",
    "GRUPOS_MATA_MATA",
    "COPA",
    "ELIMINATORIA_DUPLA",
  ];

  return validTypes.includes(clean as TournamentType)
    ? (clean as TournamentType)
    : "PONTOS_CORRIDOS";
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatSeasonStatus(status: string): string {
  const statuses: Record<string, string> = {
    CONFIGURACAO: "Configuração",
    INSCRICOES: "Inscrições",
    SORTEIO: "Sorteio",
    ANDAMENTO: "Em Andamento",
    FINALIZADO: "Finalizado",
  };
  return statuses[status] || status;
}

export function formatTournamentType(type?: string | null): string {
  const normalized = normalizeTournamentType(type);

  const types: Record<TournamentType, string> = {
    PONTOS_CORRIDOS: "Pontos Corridos",
    MATA_MATA: "Mata-mata",
    GRUPOS_MATA_MATA: "Grupos + Mata-mata",
    COPA: "Copa",
    ELIMINATORIA_DUPLA: "Eliminatória Dupla",
  };

  return types[normalized] || "Pontos Corridos";
}

export function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "US"
  );
}

export function getFirstName(fullName: string | undefined): string {
  return fullName?.split(" ")[0] || "Usuário";
}