import { supabase } from '@/lib/supabase';

export async function deleteChampionship(id: string) {
  const { error } = await supabase
    .from('championships')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
