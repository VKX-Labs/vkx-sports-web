export interface Player {
  id: string;
  season_id: string;
  team_id: string | null;
  name: string;
  photo_url: string | null;
  created_at: string;
  team_name?: string;
}

export interface CreatePlayerInput {
  name: string;
  team_id: string | null;
  photo_url?: string | null;
}

export interface UpdatePlayerInput {
  name?: string;
  team_id?: string | null;
  photo_url?: string | null;
}