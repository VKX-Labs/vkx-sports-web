import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { assertSeasonEditor } from "@/services/ownership";

export interface Round {
  id: string;
  round_number?: number;
  number?: number;
  name: string;
  is_completed?: boolean;
}

export function useRounds(championshipIdOrSeasonId: string) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRounds = useCallback(async (): Promise<Round[]> => {
    if (!championshipIdOrSeasonId) {
      setRounds([]);
      setLoading(false);
      return [];
    }

    setLoading(true);

    try {
      let seasonId = championshipIdOrSeasonId;

      const { data: seasonData } = await supabase
        .from("seasons")
        .select("id")
        .eq("championship_id", championshipIdOrSeasonId)
        .maybeSingle();

      if (seasonData?.id) {
        seasonId = seasonData.id;
      }

      const { data, error } = await supabase
        .from("rounds")
        .select("*")
        .eq("season_id", seasonId)
        .order("round_number", { ascending: true });

      if (error) {
        console.error(
          "Erro Supabase ao buscar rodadas:",
          error.message,
          error.details
        );
        throw error;
      }

      const roundsData = data || [];

      setRounds(roundsData);

      if (roundsData.length > 0 && !selectedRoundId) {
        setSelectedRoundId(roundsData[0].id);
      }

      return roundsData;
    } catch (err) {
      console.error("Erro ao buscar rodadas:", err);
      setRounds([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [championshipIdOrSeasonId, selectedRoundId]);

  const createRound = useCallback(
    async (customName?: string): Promise<Round | undefined> => {
      if (!championshipIdOrSeasonId) return undefined;

      try {
        let seasonId = championshipIdOrSeasonId;

        const { data: seasonData } = await supabase
          .from("seasons")
          .select("id")
          .eq("championship_id", championshipIdOrSeasonId)
          .maybeSingle();

        if (seasonData?.id) {
          seasonId = seasonData.id;
        }

        await assertSeasonEditor(seasonId);

        const nextRoundNumber = rounds.length + 1;
        const name = customName || `${nextRoundNumber}ª Rodada`;

        const { data, error } = await supabase
          .from("rounds")
          .insert({
            season_id: seasonId,
            name,
            round_number: nextRoundNumber,
          })
          .select("id, name, round_number")
          .single();

        if (error) {
          console.error(
            "Erro Supabase ao inserir rodada:",
            error.message,
            error.details,
            error.hint
          );
          alert(`Erro ao criar rodada: ${error.message}`);
          return undefined;
        }

        await fetchRounds();
        return data as Round;
      } catch (err) {
        console.error("Erro inesperado ao criar rodada:", err);
        return undefined;
      }
    },
    [championshipIdOrSeasonId, rounds.length, fetchRounds]
  );

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  return {
    rounds,
    selectedRoundId,
    setSelectedRoundId,
    loading,
    refetchRounds: fetchRounds,
    createRound,
  };
}