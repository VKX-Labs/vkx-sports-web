-- =============================================================
-- MIGRAÇÃO: 00016_rating_audit_logs
-- Descrição: Trilha de auditoria do motor de notas por partida.
--
--  1. Função is_championship_admin(championship_id): dono OU membro
--     com papel ADMIN.
--  2. Tabela rating_audit_logs: registra cada execução do motor
--     (geração de notas da rodada / backfill) com status
--     SUCCESS | WARNING | ERROR e payload em JSON.
--  3. Políticas RLS:
--     - SELECT: somente ADMIN (ou dono) do campeonato.
--     - INSERT: dono/EDITOR/ADMIN (quem pode gerar notas).
--     - UPDATE/DELETE: não permitidos pela aplicação.
-- =============================================================

-- =============================================================
-- 1. FUNÇÃO: is_championship_admin
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_championship_admin(championship_id uuid)
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
        AND role = 'ADMIN'
    );
$$;

-- =============================================================
-- 2. TABELA: rating_audit_logs
-- =============================================================
CREATE TABLE IF NOT EXISTS public.rating_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  round_number integer NOT NULL CHECK (round_number > 0),
  round_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'SUCCESS'
    CHECK (status IN ('SUCCESS', 'WARNING', 'ERROR')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.rating_audit_logs IS
  'Trilha de auditoria do motor de notas por partida (gerações e backfills).';
COMMENT ON COLUMN public.rating_audit_logs.status IS
  'SUCCESS = geração concluída; WARNING = concluída com ressalvas; ERROR = falhou.';
COMMENT ON COLUMN public.rating_audit_logs.payload IS
  'JSON com dados da execução: match_ids, atletas avaliados, notas e novas médias.';

CREATE INDEX IF NOT EXISTS idx_rating_audit_logs_championship_created
  ON public.rating_audit_logs (championship_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rating_audit_logs_season_round
  ON public.rating_audit_logs (season_id, round_number);

ALTER TABLE public.rating_audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 3. POLÍTICAS RLS
-- =============================================================
DROP POLICY IF EXISTS "Leitura da auditoria somente para administradores" ON public.rating_audit_logs;

CREATE POLICY "Leitura da auditoria somente para administradores"
  ON public.rating_audit_logs
  FOR SELECT
  USING (is_championship_admin(championship_id));

DROP POLICY IF EXISTS "Escrita da auditoria por geradores de notas" ON public.rating_audit_logs;

CREATE POLICY "Escrita da auditoria por geradores de notas"
  ON public.rating_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_championship_editor(championship_id));

GRANT SELECT ON public.rating_audit_logs TO authenticated;
GRANT INSERT ON public.rating_audit_logs TO authenticated;

-- =============================================================
-- 4. RPC: recalculates a média de TODOS os atletas
-- =============================================================
CREATE OR REPLACE FUNCTION public.recalculate_all_average_ratings()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.players p
  SET average_rating = COALESCE((
    SELECT ROUND(AVG(mps.rating)::numeric, 1)
    FROM public.match_player_stats mps
    WHERE mps.player_id = p.id
      AND mps.rating IS NOT NULL
  ), 0.0);
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_all_average_ratings() TO authenticated;