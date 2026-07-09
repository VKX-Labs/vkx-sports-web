export interface Season {
  id: string;
  name: string;
  status: 'CONFIGURACAO' | 'INSCRICOES' | 'SORTEIO' | 'ANDAMENTO' | 'FINALIZADO';
  modality: string;
  city: string | null;
  state: string | null;
  tournament_type: 'PONTOS_CORRIDOS' | 'MATA_MATA' | 'GRUPOS_MATA_MATA' | 'ELIMINATORIA_DUPLA' | 'COPA' | 'LIGA';
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