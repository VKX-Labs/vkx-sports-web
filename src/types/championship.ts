import { TournamentType } from "./tournament";

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
  user_id?: string | null;
  seasons: Season[];
}