-- =============================================================
-- MIGRAÇÃO: 00004_championship_members
-- Descrição: Cria o sistema de Seguidores e Co-organizadores.
--
--  1. Tabela championship_members (FOLLOWER / EDITOR / ADMIN).
--  2. View pública profiles (sobre auth.users) para exibir
--     nome/e-mail dos usuários no painel de gestão.
--  3. Funções auxiliares de checagem de papel (editor).
--  4. Políticas RLS da nova tabela.
--  5. Atualiza as políticas de escrita de teams, players,
--     matches, rounds, match_events, match_player_stats e
--     seasons para permitir mutações de quem tem papel
--     EDITOR/ADMIN (além do dono do campeonato).
-- =============================================================

-- =============================================================
-- 1. TABELA: championship_members
-- =============================================================
CREATE TABLE IF NOT EXISTS public.championship_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'FOLLOWER'
    CHECK (role IN ('FOLLOWER', 'EDITOR', 'ADMIN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT championship_members_championship_user_unique UNIQUE (championship_id, user_id)
);

COMMENT ON TABLE public.championship_members IS
  'Seguidores e co-organizadores de um campeonato.';
COMMENT ON COLUMN public.championship_members.role IS
  'FOLLOWER = apenas segue; EDITOR = pode editar/lançar súmula; ADMIN = co-organizador total.';

ALTER TABLE public.championship_members ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 2. VIEW: profiles (nome/e-mail dos usuários)
-- =============================================================
CREATE OR REPLACE VIEW public.profiles AS
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', '') AS full_name,
  COALESCE(u.raw_user_meta_data->>'avatar_url', '') AS avatar_url
FROM auth.users u;

GRANT SELECT ON public.profiles TO anon, authenticated;

-- =============================================================
-- 3. FUNÇÕES AUXILIARES
-- =============================================================

-- Verifica se o usuário possui um papel específico no campeonato.
CREATE OR REPLACE FUNCTION public.is_championship_member_with_role(
  championship_id uuid,
  p_role text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.championship_members
    WHERE championship_id = $1
      AND user_id = auth.uid()
      AND role = $2
  );
$$;

-- Verifica se o usuário pode editar o campeonato:
-- dono OU membro com papel EDITOR/ADMIN.
CREATE OR REPLACE FUNCTION public.is_championship_editor(championship_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_championship_owner($1)
    OR EXISTS (
      SELECT 1
      FROM public.championship_members
      WHERE championship_id = $1
        AND user_id = auth.uid()
        AND role IN ('EDITOR', 'ADMIN')
    );
$$;

-- Verifica se o usuário pode editar dados de uma temporada
-- (via temporada -> campeonato).
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

-- Verifica se o usuário pode editar dados de uma partida
-- (via partida -> temporada -> campeonato).
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
-- 4. POLÍTICAS RLS: championship_members
-- =============================================================

-- SELECT: qualquer pessoa (autenticada ou pública) pode ler membros.
CREATE POLICY "Leitura pública de membros do campeonato"
  ON public.championship_members
  FOR SELECT
  USING (true);

-- INSERT: usuário autenticado pode se inserir como seguidor.
CREATE POLICY "Usuário pode se inscrever como seguidor"
  ON public.championship_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'FOLLOWER'
  );

-- UPDATE: apenas o criador do campeonato pode alterar papéis.
CREATE POLICY "Dono pode alterar papel de membro"
  ON public.championship_members
  FOR UPDATE
  USING (is_championship_owner(championship_id))
  WITH CHECK (is_championship_owner(championship_id));

-- DELETE: apenas o criador do campeonato pode remover membros.
CREATE POLICY "Dono pode remover membro"
  ON public.championship_members
  FOR DELETE
  USING (is_championship_owner(championship_id));

-- =============================================================
-- 5. POLÍTICAS DE ESCRITA: times, atletas, partidas, rodadas,
--    eventos, stats e temporadas (dono OU EDITOR/ADMIN)
-- =============================================================

-- ========== teams ==========
DROP POLICY IF EXISTS "Dono pode criar equipes (INSERT)" ON public.teams;
DROP POLICY IF EXISTS "Dono pode alterar equipes (UPDATE)" ON public.teams;
DROP POLICY IF EXISTS "Dono pode excluir equipes (DELETE)" ON public.teams;

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

-- ========== players ==========
DROP POLICY IF EXISTS "Dono pode criar atletas (INSERT)" ON public.players;
DROP POLICY IF EXISTS "Dono pode alterar atletas (UPDATE)" ON public.players;
DROP POLICY IF EXISTS "Dono pode excluir atletas (DELETE)" ON public.players;

CREATE POLICY "Criador ou editor pode criar atletas (INSERT)"
  ON public.players
  FOR INSERT
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode alterar atletas (UPDATE)"
  ON public.players
  FOR UPDATE
  USING (is_season_editor(season_id))
  WITH CHECK (is_season_editor(season_id));

CREATE POLICY "Criador ou editor pode excluir atletas (DELETE)"
  ON public.players
  FOR DELETE
  USING (is_season_editor(season_id));

-- ========== matches ==========
DROP POLICY IF EXISTS "Dono pode criar partidas (INSERT)" ON public.matches;
DROP POLICY IF EXISTS "Dono pode alterar partidas (UPDATE)" ON public.matches;
DROP POLICY IF EXISTS "Dono pode excluir partidas (DELETE)" ON public.matches;

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

-- ========== rounds ==========
DROP POLICY IF EXISTS "Dono pode criar rodadas (INSERT)" ON public.rounds;
DROP POLICY IF EXISTS "Dono pode alterar rodadas (UPDATE)" ON public.rounds;
DROP POLICY IF EXISTS "Dono pode excluir rodadas (DELETE)" ON public.rounds;

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

-- ========== match_events ==========
DROP POLICY IF EXISTS "Dono pode criar eventos (INSERT)" ON public.match_events;
DROP POLICY IF EXISTS "Dono pode alterar eventos (UPDATE)" ON public.match_events;
DROP POLICY IF EXISTS "Dono pode excluir eventos (DELETE)" ON public.match_events;

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

-- ========== match_player_stats (se existir) ==========
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'match_player_stats'
  ) THEN
    ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Dono pode criar stats (INSERT)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Dono pode alterar stats (UPDATE)" ON public.match_player_stats;
    DROP POLICY IF EXISTS "Dono pode excluir stats (DELETE)" ON public.match_player_stats;

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

-- ========== seasons ==========
DROP POLICY IF EXISTS "Dono pode criar temporadas (INSERT)" ON public.seasons;
DROP POLICY IF EXISTS "Dono pode alterar temporadas (UPDATE)" ON public.seasons;
DROP POLICY IF EXISTS "Dono pode excluir temporadas (DELETE)" ON public.seasons;

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
