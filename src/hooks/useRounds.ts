
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Round {
  id: string;
  number: number;
  name: string;
  is_completed: boolean;
}

export function useRounds(seasonId: string) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRounds = useCallback(async () => {
    if (!seasonId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('season_id', seasonId)
        .order('number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setRounds(data);
        if (!selectedRoundId) {
          setSelectedRoundId(data[0].id);
        }
      } else {
        setRounds([]);
      }
    } catch (err) {
      console.error('Erro ao buscar rodadas:', err);
    } finally {
      setLoading(false);
    }
  }, [seasonId, selectedRoundId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  return { rounds, selectedRoundId, setSelectedRoundId, loading, refetchRounds: fetchRounds };
}