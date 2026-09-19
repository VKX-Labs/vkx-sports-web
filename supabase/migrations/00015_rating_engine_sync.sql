-- =============================================================
-- MIGRAÇÃO: 00015_rating_engine_sync
-- Descrição: Garantias do motor de notas por partida (estilo
--            Sofascore) para a sincronização de players.average_rating.
--
--  1. Função sync_player_average_rating agora trata INSERT, UPDATE
--     e DELETE em match_player_stats (mantém a média correta quando
--     uma nota é alterada ou removida) e garante padrão 0.0.
--  2. Trigger trg_sync_player_average_rating dispara após INSERT,
--     UPDATE OF rating ou DELETE.
--  3. Backfill: recalcula a média de TODOS os atletas a partir dos
--     ratings já persistidos em match_player_stats.
--
-- Observação: idempotente. Substitui as versões de 00007/00013.
-- =============================================================

-- =============================================================
-- 1. FUNÇÃO: recalcula players.average_rating (INSERT/UPDATE/DELETE)
-- =============================================================
CREATE OR REPLACE FUNCTION public.sync_player_average_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id uuid;
  v_avg numeric(3,1);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_player_id := OLD.player_id;
  ELSE
    v_player_id := NEW.player_id;
  END IF;

  SELECT ROUND(AVG(mps.rating)::numeric, 1)
  INTO v_avg
  FROM public.match_player_stats mps
  WHERE mps.player_id = v_player_id
    AND mps.rating IS NOT NULL;

  UPDATE public.players p
  SET average_rating = COALESCE(v_avg, 0.0)
  WHERE p.id = v_player_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================
-- 2. TRIGGER: INSERT / UPDATE OF rating / DELETE
-- =============================================================
DROP TRIGGER IF EXISTS trg_sync_player_average_rating ON public.match_player_stats;

CREATE TRIGGER trg_sync_player_average_rating
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.match_player_stats
FOR EACH ROW
EXECUTE FUNCTION public.sync_player_average_rating();

-- =============================================================
-- 3. BACKFILL: recalcula a média de todos os atletas
-- =============================================================
UPDATE public.players p
SET average_rating = COALESCE((
  SELECT ROUND(AVG(mps.rating)::numeric, 1)
  FROM public.match_player_stats mps
  WHERE mps.player_id = p.id
    AND mps.rating IS NOT NULL
), 0.0);

COMMENT ON COLUMN public.players.average_rating IS
  'Média das notas das partidas do atleta na temporada (1.0 a 10.0). Atualizada por trigger (INSERT/UPDATE/DELETE).';