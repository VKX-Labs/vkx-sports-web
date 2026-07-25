export interface Player {
  id: string;
  season_id: string;
  team_id: string | null;
  name: string;
  nickname?: string | null;
  number?: number | null;
  position?: string | null;
  photo_url: string | null;
  status?: string | null;
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
  rating: number; // Nota média
}

export interface CreatePlayerInput {
  name: string;
  nickname?: string | null;
  number?: number | null;
  position?: string | null;
  team_id: string | null;
  photo_url?: string | null;
  status?: string | null;
}

export interface UpdatePlayerInput {
  name?: string;
  nickname?: string | null;
  number?: number | null;
  position?: string | null;
  team_id?: string | null;
  photo_url?: string | null;
  status?: string | null;
}