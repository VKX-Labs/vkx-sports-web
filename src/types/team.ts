export interface Team {
  id: string;
  season_id: string;
  name: string;
  badge_url: string | null;
  initials: string | null; 
  city: string | null;
  state: string | null;
  country: string | null;
  manager_name: string | null;
  manager_phone: string | null;
  manager_email: string | null;
  instagram: string | null;
  description: string | null;
  primary_kit_color: string | null;
  secondary_kit_color: string | null;
  created_at: string;
  
  _count?: {
    players: number;
  };
}