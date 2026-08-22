-- =============================================================
-- MIGRAÇÃO: 00013_average_rating_leaderboard
-- Descrição: Garantias para o ranking "Notas Médias" do leaderboard
--            de estatísticas (lista completa, sem top 10).
--
--  1. Coluna average_rating em players (numeric(3,1), padrão 0.0),
--     com backfill de NULL -> 0.0 para filtros/ordenação consistentes.
--  2. Função sync_player_average_rating (recalcula a nota média do
--     atleta a partir de match_player_stats).
--  3. Trigger trg_sync_player_average_rating: dispara após INSERT ou
--     UPDATE OF rating em match_player_stats.
--
-- Observação: a coluna e o trigger foram criados originalmente na
-- migration 00007; esta migração é idempotente e garante o estado
-- esperado (DEFAULT 0.0 + função/trigger atualizados).
-- =============================================================

-- =============================================================
-- 1. COLUNA average_rating EM players
-- =============================================================
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS average_rating numeric(3,1);

ALTER TABLE public.players
  ALTER COLUMN average_rating SET DEFAULT 0.0;

-- Normaliza registros antigos sem nota calculada.
UPDATE public.players
SET average_rating = 0.0
WHERE average_rating IS NULL;

COMMENT ON COLUMN public.players.average_rating IS
  'Média das notas das partidas do atleta na temporada (0.0 a 10.0). Atualizada por trigger.';

-- =============================================================
-- 2. FUNÇÃO: recalcula players.average_rating
-- =============================================================
CREATE OR REPLACE FUNCTION public.sync_player_average_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.players p
  SET average_rating = (
    SELECT ROUND(AVG(mps.rating)::numeric, 1)
    FROM public.match_player_stats mps
    WHERE mps.player_id = NEW.player_id
      AND mps.rating IS NOT NULL
  )
  WHERE p.id = NEW.player_id;

  RETURN NEW;
END;
$$;

-- =============================================================
-- 3. TRIGGER: INSERT OR UPDATE OF rating em match_player_stats
-- =============================================================
DROP TRIGGER IF EXISTS trg_sync_player_average_rating ON public.match_player_stats;

CREATE TRIGGER trg_sync_player_average_rating
AFTER INSERT OR UPDATE OF rating ON public.match_player_stats
FOR EACH ROW
EXECUTE FUNCTION public.sync_player_average_rating();
