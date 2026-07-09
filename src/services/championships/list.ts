import { supabase } from '@/lib/supabase';

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

export async function getMyChampionships() {
  const { data, error } = await supabase
    .from('championships')
    .select(`
      id,
      name,
      slug,
      created_at,
      seasons (
        id,
        name,
        status,
        modality,
        city,
        state,
        tournament_type,
        max_teams
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
