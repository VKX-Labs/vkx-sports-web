export interface Team {
  id: string;
  season_id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  manager: string | null;
  badge_url: string | null;
  created_at: string;

  _count?: {
    players: number;
  };
}

export type CreateTeamPayload = {
  season_id: string;
  name: string;
  short_name?: string | null;
  city?: string | null;
  manager?: string | null;
  badge_url?: string | null;
};
