-- =============================================================
-- MIGRAÇÃO: 00008_editor_permissions
-- Descrição: Consolida e garante as permissões de escrita para o
--            perfil EDITOR (e ADMIN / dono) dentro do campeonato.
--
--  Objetivo: Dono (championships.user_id) e membros com papel
--            'EDITOR' ou 'ADMIN' em championship_members passam a
--            ter permissão total de INSERT/UPDATE/DELETE em:
--              - teams
--              - players (inclui transferência de time no mesmo
--                campeonato)
--              - rounds
--              - matches
--              - match_events
--              - match_player_stats
--              - seasons
--              - round_summaries
--
--  Idempotente: usa CREATE OR REPLACE / DROP POLICY IF EXISTS,
--  podendo ser reaplicada sem duplicação. Corrige também a
--  política ampla ("Permitir escrita para autenticados") criada na
--  migração 00006, que liberava escrita de round_summaries para
--  qualquer usuário autenticado.
-- =============================================================

-- =============================================================
-- 1. FUNÇÕES AUXILIARES DE VERIFICAÇÃO
-- =============================================================

-- Dono do campeonato.
CREATE OR REPLACE FUNCTION public.is_championship_owner(championship_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.championships
    WHERE id = championship_id
      AND user_id = auth.uid()
  );
$$;

-- Dono OU membro com papel ADMIN/EDITOR no campeonato.
CREATE OR REPLACE FUNCTION public.is_championship_editor(param_championship_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.championships c
    LEFT JOIN public.championship_members cm ON cm.championship_id = c.id
    WHERE c.id = param_championship_id
      AND (
        c.user_id = auth.uid()
        OR (cm.user_id = auth.uid() AND cm.role IN ('ADMIN', 'EDITOR'))
      )
  );
END;
$$;

-- Dono/editor via temporada -> campeonato.
CREATE OR REPLACE FUNCTION public.is_season_editor(season_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.seasons s
    JOIN public.championships c ON c.id = s.championship_id
    WHERE s.id = $1
      AND public.is_championship_editor(c.id)
  );
$$;

-- Dono/editor via partida -> temporada -> campeonato.
CREATE OR REPLACE FUNCTION public.is_match_editor(match_id uuid)
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
    WHERE m.id = $1
      AND public.is_championship_editor(c.id)
  );
$$;

-- =============================================================
-- 2. POLÍTICAS RLS: teams
--    Criar / Editar / Excluir times do campeonato.
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.teams;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.teams;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.teams;
DROP POLICY IF EXISTS "Dono pode criar equipes (INSERT)" ON public.teams;
DROP POLICY IF EXISTS "Dono pode alterar equipes (UPDATE)" ON public.teams;
DROP POLICY IF EXISTS "Dono pode excluir equipes (DELETE)" ON public.teams;
DROP POLICY IF EXISTS "Criador ou editor pode criar equipes (INSERT)" ON public.teams;
DROP POLICY IF EXISTS "Criador ou editor pode alterar equipes (UPDATE)" ON public.teams;
DROP POLICY IF EXISTS "Criador ou editor pode excluir equipes (DELETE)" ON public.teams;

CREATE POLICY "Criador ou editor pode criar equipes (INSERT)"
  ON public.teams
  FOR INSERT
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode alterar equipes (UPDATE)"
  ON public.teams
  FOR UPDATE
  USING (is_season_editor(season_id))
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode excluir equipes (DELETE)"
  ON public.teams
  FOR DELETE
  USING (is_season_editor(season_id));

-- =============================================================
-- 3. POLÍTICAS RLS: players
--    Criar / Editar / Excluir jogadores. A transferência (alterar
--    team_id) só é permitida para times do MESMO campeonato.
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.players;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.players;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.players;
DROP POLICY IF EXISTS "Dono pode criar atletas (INSERT)" ON public.players;
DROP POLICY IF EXISTS "Dono pode alterar atletas (UPDATE)" ON public.players;
DROP POLICY IF EXISTS "Dono pode excluir atletas (DELETE)" ON public.players;
DROP POLICY IF EXISTS "Criador ou editor pode criar atletas (INSERT)" ON public.players;
DROP POLICY IF EXISTS "Criador ou editor pode alterar atletas (UPDATE)" ON public.players;
DROP POLICY IF EXISTS "Criador ou editor pode excluir atletas (DELETE)" ON public.players;

CREATE POLICY "Criador ou editor pode criar atletas (INSERT)"
  ON public.players
  FOR INSERT
  WITH CHECK (
    is_season_editor(season_id)
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_id AND t.season_id = season_id
      )
    )
  );

CREATE POLICY "Criador ou editor pode alterar atletas (UPDATE)"
  ON public.players
  FOR UPDATE
  USING (is_season_editor(season_id))
  WITH CHECK (
    is_season_editor(season_id)
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_id AND t.season_id = season_id
      )
    )
  );

CREATE POLICY "Criador ou editor pode excluir atletas (DELETE)"
  ON public.players
  FOR DELETE
  USING (is_season_editor(season_id));

-- =============================================================
-- 4. POLÍTICAS RLS: rounds
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.rounds;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.rounds;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.rounds;
DROP POLICY IF EXISTS "Dono pode criar rodadas (INSERT)" ON public.rounds;
DROP POLICY IF EXISTS "Dono pode alterar rodadas (UPDATE)" ON public.rounds;
DROP POLICY IF EXISTS "Dono pode excluir rodadas (DELETE)" ON public.rounds;
DROP POLICY IF EXISTS "Criador ou editor pode criar rodadas (INSERT)" ON public.rounds;
DROP POLICY IF EXISTS "Criador ou editor pode alterar rodadas (UPDATE)" ON public.rounds;
DROP POLICY IF EXISTS "Criador ou editor pode excluir rodadas (DELETE)" ON public.rounds;

CREATE POLICY "Criador ou editor pode criar rodadas (INSERT)"
  ON public.rounds
  FOR INSERT
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode alterar rodadas (UPDATE)"
  ON public.rounds
  FOR UPDATE
  USING (is_season_editor(season_id))
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode excluir rodadas (DELETE)"
  ON public.rounds
  FOR DELETE
  USING (is_season_editor(season_id));

-- =============================================================
-- 5. POLÍTICAS RLS: matches
-- =============================================================
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (INSERT)" ON public.matches;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (UPDATE)" ON public.matches;
DROP POLICY IF EXISTS "Acesso via temporada do campeonato (DELETE)" ON public.matches;
DROP POLICY IF EXISTS "Dono pode criar partidas (INSERT)" ON public.matches;
DROP POLICY IF EXISTS "Dono pode alterar partidas (UPDATE)" ON public.matches;
DROP POLICY IF EXISTS "Dono pode excluir partidas (DELETE)" ON public.matches;
DROP POLICY IF EXISTS "Criador ou editor pode criar partidas (INSERT)" ON public.matches;
DROP POLICY IF EXISTS "Criador ou editor pode alterar partidas (UPDATE)" ON public.matches;
DROP POLICY IF EXISTS "Criador ou editor pode excluir partidas (DELETE)" ON public.matches;

CREATE POLICY "Criador ou editor pode criar partidas (INSERT)"
  ON public.matches
  FOR INSERT
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode alterar partidas (UPDATE)"
  ON public.matches
  FOR UPDATE
  USING (is_season_editor(season_id))
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode excluir partidas (DELETE)"
  ON public.matches
  FOR DELETE
  USING (is_season_editor(season_id));

-- =============================================================
-- 6. POLÍTICAS RLS: match_events
--    (gols, cartões, assistências, defesas, etc.)
-- =============================================================
DROP POLICY IF EXISTS "Acesso via partida do campeonato (INSERT)" ON public.match_events;
DROP POLICY IF EXISTS "Acesso via partida do campeonato (UPDATE)" ON public.match_events;
DROP POLICY IF EXISTS "Acesso via partida do campeonato (DELETE)" ON public.match_events;
DROP POLICY IF EXISTS "Dono pode criar eventos (INSERT)" ON public.match_events;
DROP POLICY IF EXISTS "Dono pode alterar eventos (UPDATE)" ON public.match_events;
DROP POLICY IF EXISTS "Dono pode excluir eventos (DELETE)" ON public.match_events;
DROP POLICY IF EXISTS "Criador ou editor pode criar eventos (INSERT)" ON public.match_events;
DROP POLICY IF EXISTS "Criador ou editor pode alterar eventos (UPDATE)" ON public.match_events;
DROP POLICY IF EXISTS "Criador ou editor pode excluir eventos (DELETE)" ON public.match_events;

CREATE POLICY "Criador ou editor pode criar eventos (INSERT)"
  ON public.match_events
  FOR INSERT
  WITH CHECK (is_match_editor(match_id));

CREATE POLICY "Criador ou editor pode alterar eventos (UPDATE)"
  ON public.match_events
  FOR UPDATE
  USING (is_match_editor(match_id))
  WITH CHECK (is_match_editor(match_id));

CREATE POLICY "Criador ou editor pode excluir eventos (DELETE)"
  ON public.match_events
  FOR DELETE
  USING (is_match_editor(match_id));

-- =============================================================
-- 7. POLÍTICAS RLS: match_player_stats (se existir)
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
    DROP POLICY IF EXISTS "Dono pode criar stats (INSERT)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Dono pode alterar stats (UPDATE)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Dono pode excluir stats (DELETE)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Criador ou editor pode criar stats (INSERT)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Criador ou editor pode alterar stats (UPDATE)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Criador ou editor pode excluir stats (DELETE)" ON public.match_player_stats;

    CREATE POLICY "Criador ou editor pode criar stats (INSERT)"
      ON public.match_player_stats
      FOR INSERT
      WITH CHECK (is_match_editor(match_id));

    CREATE POLICY "Criador ou editor pode alterar stats (UPDATE)"
      ON public.match_player_stats
      FOR UPDATE
      USING (is_match_editor(match_id))
      WITH CHECK (is_match_editor(match_id));

    CREATE POLICY "Criador ou editor pode excluir stats (DELETE)"
      ON public.match_player_stats
      FOR DELETE
      USING (is_match_editor(match_id));
  END IF;
END $$;

-- =============================================================
-- 8. POLÍTICAS RLS: seasons
-- =============================================================
DROP POLICY IF EXISTS "Acesso via propriedade do campeonato (INSERT)" ON public.seasons;
DROP POLICY IF EXISTS "Acesso via propriedade do campeonato (UPDATE)" ON public.seasons;
DROP POLICY IF EXISTS "Acesso via propriedade do campeonato (DELETE)" ON public.seasons;
DROP POLICY IF EXISTS "Dono pode criar temporadas (INSERT)" ON public.seasons;
DROP POLICY IF EXISTS "Dono pode alterar temporadas (UPDATE)" ON public.seasons;
DROP POLICY IF EXISTS "Dono pode excluir temporadas (DELETE)" ON public.seasons;
DROP POLICY IF EXISTS "Criador ou editor pode criar temporadas (INSERT)" ON public.seasons;
DROP POLICY IF EXISTS "Criador ou editor pode alterar temporadas (UPDATE)" ON public.seasons;
DROP POLICY IF EXISTS "Criador ou editor pode excluir temporadas (DELETE)" ON public.seasons;

CREATE POLICY "Criador ou editor pode criar temporadas (INSERT)"
  ON public.seasons
  FOR INSERT
  WITH CHECK (is_championship_editor(championship_id));

CREATE POLICY "Criador ou editor pode alterar temporadas (UPDATE)"
  ON public.seasons
  FOR UPDATE
  USING (is_championship_editor(championship_id))
  WITH CHECK (is_championship_editor(championship_id));

CREATE POLICY "Criador ou editor pode excluir temporadas (DELETE)"
  ON public.seasons
  FOR DELETE
  USING (is_championship_editor(championship_id));

-- =============================================================
-- 9. POLÍTICAS RLS: round_summaries
--    Corrige a política ampla da migração 00006 ("escrita para
--    autenticados") e restaura a escrita apenas para dono/editor.
-- =============================================================
DROP POLICY IF EXISTS "Leitura pública de resumos de rodada" ON public.round_summaries;
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.round_summaries;
DROP POLICY IF EXISTS "Criador ou editor pode criar resumos de rodada (INSERT)" ON public.round_summaries;
DROP POLICY IF EXISTS "Criador ou editor pode alterar resumos de rodada (UPDATE)" ON public.round_summaries;
DROP POLICY IF EXISTS "Criador ou editor pode excluir resumos de rodada (DELETE)" ON public.round_summaries;
DROP POLICY IF EXISTS "Permitir escrita para autenticados" ON public.round_summaries;

CREATE POLICY "Leitura pública de resumos de rodada"
  ON public.round_summaries
  FOR SELECT
  USING (true);

CREATE POLICY "Criador ou editor pode criar resumos de rodada (INSERT)"
  ON public.round_summaries
  FOR INSERT
  WITH CHECK (is_championship_editor(championship_id));

CREATE POLICY "Criador ou editor pode alterar resumos de rodada (UPDATE)"
  ON public.round_summaries
  FOR UPDATE
  USING (is_championship_editor(championship_id))
  WITH CHECK (is_championship_editor(championship_id));

CREATE POLICY "Criador ou editor pode excluir resumos de rodada (DELETE)"
  ON public.round_summaries
  FOR DELETE
  USING (is_championship_editor(championship_id));

-- =============================================================
-- 10. REVOGAÇÕES DE SEGURANÇA (championship_members)
--     Mantém: SELECT público, auto-inscrição como FOLLOWER, e
--     alteração de papel/remoção apenas para o dono.
-- =============================================================
DROP POLICY IF EXISTS "Leitura pública de membros do campeonato" ON public.championship_members;
DROP POLICY IF EXISTS "Usuário pode se inscrever como seguidor" ON public.championship_members;
DROP POLICY IF EXISTS "Dono pode alterar papel de membro" ON public.championship_members;
DROP POLICY IF EXISTS "Dono pode remover membro" ON public.championship_members;

CREATE POLICY "Leitura pública de membros do campeonato"
  ON public.championship_members
  FOR SELECT
  USING (true);

CREATE POLICY "Usuário pode se inscrever como seguidor"
  ON public.championship_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'FOLLOWER'
  );

CREATE POLICY "Dono pode alterar papel de membro"
  ON public.championship_members
  FOR UPDATE
  USING (is_championship_owner(championship_id))
  WITH CHECK (is_championship_owner(championship_id));

CREATE POLICY "Dono pode remover membro"
  ON public.championship_members
  FOR DELETE
  USING (is_championship_owner(championship_id));
