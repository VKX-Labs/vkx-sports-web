-- =============================================================
-- MIGRAÇÃO: 00003_owner_write_policies
-- Descrição: Reforça que TODA escrita (INSERT/UPDATE/DELETE) em
--            teams, players, matches, rounds, match_events e
--            match_player_stats somente é permitida quando o
--            auth.uid() corresponde ao user_id do campeonato
--            vinculado (dono).
--
--            Garante a "trava global de dono" no banco, mesmo que
--            políticas antigas tenham sido removidas ou alteradas
--            manualmente. As políticas de SELECT continuam públicas
--            (definidas na migração 00002).
-- =============================================================

-- 1. FUNÇÃO AUXILIAR: Verifica se o usuário é dono do campeonato
--    através do ID da partida (match -> season -> championship).
CREATE OR REPLACE FUNCTION public.is_match_owner(match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches m
    JOIN public.seasons s ON s.id = m.season_id
    JOIN public.championships c ON c.id = s.championship_id
    WHERE m.id = match_id
      AND c.user_id = auth.uid()
  );
$$;

-- =============================================================
-- TABELA: teams
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.teams;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.teams;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.teams;

CREATE POLICY "Dono pode criar equipes (INSERT)"
  ON public.teams
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode alterar equipes (UPDATE)"
  ON public.teams
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode excluir equipes (DELETE)"
  ON public.teams
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: players
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.players;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.players;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.players;

CREATE POLICY "Dono pode criar atletas (INSERT)"
  ON public.players
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode alterar atletas (UPDATE)"
  ON public.players
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode excluir atletas (DELETE)"
  ON public.players
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: matches
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.matches;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.matches;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.matches;

CREATE POLICY "Dono pode criar partidas (INSERT)"
  ON public.matches
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode alterar partidas (UPDATE)"
  ON public.matches
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode excluir partidas (DELETE)"
  ON public.matches
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: rounds
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.rounds;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.rounds;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.rounds;

CREATE POLICY "Dono pode criar rodadas (INSERT)"
  ON public.rounds
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode alterar rodadas (UPDATE)"
  ON public.rounds
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Dono pode excluir rodadas (DELETE)"
  ON public.rounds
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: match_events
-- =============================================================
DROP POLICY IF EXISTS "Acesso via partida do campeonato (INSERT)" ON public.match_events;
DROP POLICY IF EXISTS "Acesso via partida do campeonato (UPDATE)" ON public.match_events;
DROP POLICY IF EXISTS "Acesso via partida do campeonato (DELETE)" ON public.match_events;

CREATE POLICY "Dono pode criar eventos (INSERT)"
  ON public.match_events
  FOR INSERT
  WITH CHECK (is_match_owner(match_id));

CREATE POLICY "Dono pode alterar eventos (UPDATE)"
  ON public.match_events
  FOR UPDATE
  USING (is_match_owner(match_id))
  WITH CHECK (is_match_owner(match_id));

CREATE POLICY "Dono pode excluir eventos (DELETE)"
  ON public.match_events
  FOR DELETE
  USING (is_match_owner(match_id));

-- =============================================================
-- TABELA: match_player_stats (se existir)
-- =============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'match_player_stats'
  ) THEN
    ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Acesso via partida do campeonato (INSERT)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Acesso via partida do campeonato (UPDATE)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Acesso via partida do campeonato (DELETE)" ON public.match_player_stats;

    CREATE POLICY "Dono pode criar stats (INSERT)"
      ON public.match_player_stats
      FOR INSERT
      WITH CHECK (is_match_owner(match_id));

    CREATE POLICY "Dono pode alterar stats (UPDATE)"
      ON public.match_player_stats
      FOR UPDATE
      USING (is_match_owner(match_id))
      WITH CHECK (is_match_owner(match_id));

    CREATE POLICY "Dono pode excluir stats (DELETE)"
      ON public.match_player_stats
      FOR DELETE
      USING (is_match_owner(match_id));
  END IF;
END $$;

-- =============================================================
-- REFORÇO ADICIONAL: políticas de escrita da temporada
-- (reafirmadas, caso tenham sido alteradas manualmente)
-- =============================================================
DROP POLICY IF EXISTS "Acesso via propriedade do campeonato (INSERT)" ON public.seasons;
DROP POLICY IF EXISTS "Acesso via propriedade do campeonato (UPDATE)" ON public.seasons;
DROP POLICY IF EXISTS "Acesso via propriedade do campeonato (DELETE)" ON public.seasons;

CREATE POLICY "Dono pode criar temporadas (INSERT)"
  ON public.seasons
  FOR INSERT
  WITH CHECK (is_championship_owner(championship_id));

CREATE POLICY "Dono pode alterar temporadas (UPDATE)"
  ON public.seasons
  FOR UPDATE
  USING (is_championship_owner(championship_id))
  WITH CHECK (is_championship_owner(championship_id));

CREATE POLICY "Dono pode excluir temporadas (DELETE)"
  ON public.seasons
  FOR DELETE
  USING (is_championship_owner(championship_id));
