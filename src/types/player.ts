export const PLAYER_POSITIONS = [
  "GOLEIRO",
  "ZAGUEIRO",
  "LATERAL_DIREITO",
  "LATERAL_ESQUERDO",
  "VOLANTE",
  "MEIA_ATACANTE",
  "PONTA_DIREITA",
  "PONTA_ESQUERDA",
  "CENTROAVANTE",
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  GOLEIRO: "Goleiro",
  ZAGUEIRO: "Zagueiro",
  LATERAL_DIREITO: "Lateral Direito",
  LATERAL_ESQUERDO: "Lateral Esquerdo",
  VOLANTE: "Volante",
  MEIA_ATACANTE: "Meia Atacante",
  PONTA_DIREITA: "Ponta Direita",
  PONTA_ESQUERDA: "Ponta Esquerda",
  CENTROAVANTE: "Centroavante",
};

export interface Player {
  id: string;
  season_id: string;
  team_id: string | null;
  name: string;
  nickname?: string | null;
  number?: number | null;
  position?: PlayerPosition | null;
  photo_url: string | null;
  status?: string | null;
  average_rating?: number | null;
  created_at: string;
  team_name?: string;
}

export interface PlayerStats {
  matches: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  tackles: number;
  rating: number;
}

export interface CreatePlayerInput {
  name: string;
  nickname?: string | null;
  number?: number | null;
  position?: PlayerPosition | null;
  team_id: string | null;
  photo_url?: string | null;
  status?: string | null;
}

export interface UpdatePlayerInput {
  name?: string;
  nickname?: string | null;
  number?: number | null;
  position?: PlayerPosition | null;
  team_id?: string | null;
  photo_url?: string | null;
  status?: string | null;
}
