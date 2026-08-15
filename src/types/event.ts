export type EventType = 
  | "GOAL" 
  | "ASSIST" 
  | "YELLOW_CARD" 
  | "RED_CARD" 
  | "SAVE" 
  | "SUBSTITUTION" 
  | "PENALTY" 
  | "FOUL" 
  | "CORNER" 
  | "TACKLE"
  | "WO";

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id?: string | null;
  assist_player_id?: string | null;
  goalkeeper_id?: string | null;
  type: EventType;
  minute?: number | null;
  rating?: number | null;
  observation?: string | null;
  created_at: string;
}