-- =============================================================
-- MIGRAÇÃO: 00017_rating_engine_refactor
-- Descrição: Motor de notas por partida + controle de rodada ativa.
--
--  1. Coluna seasons.current_round_number: rodada exibida como
--     principal (avançada ao finalizar uma rodada).
--  2. Função advance_season_current_round(season_id, next_round):
--     avança a rodada ativa da temporada. Permite Dono e membros
--     com papel ADMIN (is_championship_admin). Usa SECURITY DEFINER
--     para burlar o RLS de seasons (que só libera o dono).
-- =============================================================

-- =============================================================
-- 1. seasons.current_round_number
-- =============================================================
ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS current_round_number integer;

COMMENT ON COLUMN public.seasons.current_round_number IS
  'Número da rodada ativa (principal em exibição). Avançada ao finalizar uma rodada.';

UPDATE public.seasons
SET current_round_number = 1
WHERE current_round_number IS NULL;

-- =============================================================
-- 2. advance_season_current_round (Dono e ADMIN)
-- =============================================================
CREATE OR REPLACE FUNCTION public.advance_season_current_round(
  season_id uuid,
  next_round_number integer DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_championship_id uuid;
  v_current integer;
BEGIN
  SELECT s.championship_id, COALESCE(s.current_round_number, 1)
  INTO v_championship_id, v_current
  FROM public.seasons s
  WHERE s.id = season_id;

  IF v_championship_id IS NULL THEN
    RAISE EXCEPTION 'Temporada não encontrada.';
  END IF;

  IF NOT public.is_championship_admin(v_championship_id) THEN
    RAISE EXCEPTION 'Somente o ADMIN/criador do campeonato pode finalizar uma rodada.';
  END IF;

  UPDATE public.seasons s
  SET current_round_number = COALESCE(next_round_number, v_current + 1)
  WHERE s.id = season_id
  RETURNING COALESCE(s.current_round_number, v_current + 1) INTO v_current;

  RETURN v_current;
END;
$$;

GRANT EXECUTE ON FUNCTION public.advance_season_current_round(uuid, integer) TO authenticated;