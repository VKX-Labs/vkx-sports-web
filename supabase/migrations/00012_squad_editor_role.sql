-- =============================================================
-- MIGRAÇÃO: 00012_squad_editor_role
-- Descrição:
--  1. Adiciona o papel 'SQUAD_EDITOR' ao CHECK constraint de
--     championship_members.role.
--  2. Cria função is_championship_squad_editor() que verifica se
--     o usuário é dono OU tem papel SQUAD_EDITOR no campeonato.
--  3. Adiciona políticas RLS que permitem SQUAD_EDITOR criar e
--     editar apenas jogadores (players), sem acesso a teams,
--     matches, rounds, etc.
--  4. Atualiza o CHECK constraint de players.position para
--     substituir MEIA_CENTRAL por MEIA_DE_LIGACAO e incluir
--     SEGUNDO_ATACANTE.
--  5. Adiciona CHECK constraint em matches.wo_type.
-- =============================================================

-- =============================================================
-- 1. ATUALIZAR CHECK CONSTRAINT DE ROLES
-- =============================================================
ALTER TABLE public.championship_members
  DROP CONSTRAINT IF EXISTS championship_members_role_check;

ALTER TABLE public.championship_members
  ADD CONSTRAINT championship_members_role_check
  CHECK (role IN ('FOLLOWER', 'SQUAD_EDITOR', 'EDITOR', 'ADMIN'));

COMMENT ON COLUMN public.championship_members.role IS
  'Papel do membro: FOLLOWER (leitura), SQUAD_EDITOR (gerencia apenas jogadores), EDITOR (edição completa), ADMIN (co-organizador).';

-- =============================================================
-- 2. FUNÇÃO: is_championship_squad_editor
--    Retorna true se o usuário for dono OU tiver papel
--    SQUAD_EDITOR, EDITOR ou ADMIN no campeonato.
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_championship_squad_editor(param_championship_id uuid)
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
        OR (cm.user_id = auth.uid() AND cm.role IN ('ADMIN', 'EDITOR', 'SQUAD_EDITOR'))
      )
  );
END;
$$;

-- =============================================================
-- 3. FUNÇÃO: is_season_squad_editor
--    Resolve season -> championship e chama
--    is_championship_squad_editor.
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_season_squad_editor(season_id uuid)
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
      AND public.is_championship_squad_editor(c.id)
  );
$$;

-- =============================================================
-- 4. POLÍTICAS RLS: players (SQUAD_EDITOR)
--    Permitir que SQUAD_EDITOR crie e edite jogadores.
--    As políticas de INSERT/UPDATE/DELETE existentes usam
--    is_season_editor(), que NÃO inclui SQUAD_EDITOR.
--    Precisamos recriar as políticas para incluir SQUAD_EDITOR.
-- =============================================================
DROP POLICY IF EXISTS "Criador ou editor pode criar atletas (INSERT)" ON public.players;
DROP POLICY IF EXISTS "Criador ou editor pode alterar atletas (UPDATE)" ON public.players;
DROP POLICY IF EXISTS "Criador ou editor pode excluir atletas (DELETE)" ON public.players;

CREATE POLICY "Criador, editor ou editor de elenco pode criar atletas (INSERT)"
  ON public.players
  FOR INSERT
  WITH CHECK (
    is_season_squad_editor(season_id)
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_id AND t.season_id = season_id
      )
    )
  );

CREATE POLICY "Criador, editor ou editor de elenco pode alterar atletas (UPDATE)"
  ON public.players
  FOR UPDATE
  USING (is_season_squad_editor(season_id))
  WITH CHECK (
    is_season_squad_editor(season_id)
    AND (
      team_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_id AND t.season_id = season_id
      )
    )
  );

CREATE POLICY "Criador, editor ou editor de elenco pode excluir atletas (DELETE)"
  ON public.players
  FOR DELETE
  USING (is_season_squad_editor(season_id));

-- =============================================================
-- 5. POSIÇÕES: substituir MEIA_CENTRAL por MEIA_DE_LIGACAO
--    e garantir SEGUNDO_ATACANTE.
-- =============================================================
ALTER TABLE public.players
  DROP CONSTRAINT IF EXISTS players_position_check;

ALTER TABLE public.players
  ADD CONSTRAINT players_position_check
  CHECK (
    position IS NULL OR position IN (
      'GOLEIRO',
      'ZAGUEIRO',
      'LATERAL_DIREITO',
      'LATERAL_ESQUERDO',
      'VOLANTE',
      'MEIA_DE_LIGACAO',
      'MEIA_ATACANTE',
      'PONTA_DIREITA',
      'PONTA_ESQUERDA',
      'SEGUNDO_ATACANTE',
      'CENTROAVANTE'
    )
  );

COMMENT ON COLUMN public.players.position IS
  'Posição do atleta: GOLEIRO, ZAGUEIRO, LATERAL_DIREITO, LATERAL_ESQUERDO, VOLANTE, MEIA_DE_LIGACAO, MEIA_ATACANTE, PONTA_DIREITA, PONTA_ESQUERDA, SEGUNDO_ATACANTE, CENTROAVANTE.';

-- Migrar dados existentes: MEIA_CENTRAL -> MEIA_DE_LIGACAO
UPDATE public.players
SET position = 'MEIA_DE_LIGACAO'
WHERE position = 'MEIA_CENTRAL';

-- =============================================================
-- 6. CHECK CONSTRAINT: matches.wo_type
-- =============================================================
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_wo_type_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_wo_type_check
  CHECK (wo_type IS NULL OR wo_type IN ('home', 'away', 'double'));
