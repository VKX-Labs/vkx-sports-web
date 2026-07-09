import { supabase } from '@/lib/supabase';
import { Championship } from '@/types/championship';

export async function getChampionship(id: string): Promise<Championship> {
  const { data, error } = await supabase
    .from('championships')
    .select(`
      id, name, slug, description, logo_url, banner_url,
      seasons (
        id, name, status, modality, city, state, tournament_type, max_teams
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Campeonato não encontrado.');

  return data as unknown as Championship;
}
