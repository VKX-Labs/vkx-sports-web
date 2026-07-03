import { supabase } from '@/lib/supabase';

export interface CreateChampionshipInput {
  name: string;
  description?: string;
  modality: string;
  city: string;
  state: string;
  tournament_type:
    | 'PONTOS_CORRIDOS'
    | 'MATA_MATA'
    | 'GRUPOS_MATA_MATA'
    | 'ELIMINATORIA_DUPLA'
    | 'COPA'
    | 'LIGA';
  max_teams?: number;
  start_date?: string;
  end_date?: string;
}

const INITIAL_SEASON_NAME = 'Temporada 2026';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Usuário não autenticado no sistema.');
  }

  return user;
}

export async function getChampionships() {
  const { data, error } = await supabase
    .from('championships')
    .select(`
      *,
      seasons (
        id,
        status,
        tournament_type,
        modality
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}

export async function getChampionshipsCount() {
  const { count, error } = await supabase
    .from('championships')
    .select('*', {
      count: 'exact',
      head: true,
    });

  if (error) throw error;

  return count ?? 0;
}

export async function createChampionshipWithSeason(
  input: CreateChampionshipInput
) {
  const user = await getAuthenticatedUser();

  const { data: championship, error: championshipError } = await supabase
    .from('championships')
    .insert({
      user_id: user.id,
      name: input.name,
      slug: generateSlug(input.name),
      description: input.description,
    })
    .select()
    .single();

  if (championshipError) {
    if (championshipError.code === '23505') {
      throw new Error(
        'Você já possui um campeonato cadastrado com este nome.'
      );
    }

    throw new Error(championshipError.message);
  }

  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .insert({
      championship_id: championship.id,
      name: INITIAL_SEASON_NAME,
      status: 'CONFIGURACAO',
      modality: input.modality,
      city: input.city,
      state: input.state.toUpperCase(),
      tournament_type: input.tournament_type,
      max_teams: input.max_teams ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
    })
    .select()
    .single();

  if (seasonError) {
    await supabase
      .from('championships')
      .delete()
      .eq('id', championship.id);

    throw new Error(seasonError.message);
  }

  return {
    championship,
    season,
  };
}