export interface Player {
  id: string;
  team_id: string;
  name: string;
  jersey_number: number | null;
  position: string | null;
  photo_url: string | null;
  created_at: string;
}
