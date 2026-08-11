-- =============================================================
-- MIGRAÇÃO: 00005_round_summaries
-- Descrição: Cria a tabela round_summaries para persistir os
--            resumos de rodada gerados pela IA. Como o resumo é
--            um boletim oficial da liga, ele deve ser visível a
--            todos (membros e visitantes), mas a escrita fica
--            restrita ao dono/editor do campeonato.
--
--  1. Tabela round_summaries com unicidade por
--     (championship_id, round_number).
--  2. RLS habilitado.
--  3. Políticas: SELECT público, escrita para editor/ADMIN/dono.
-- =============================================================

-- =============================================================
-- 1. TABELA: round_summaries
-- =============================================================
CREATE TABLE IF NOT EXISTS public.round_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id uuid NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  round_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT round_summaries_championship_round_unique UNIQUE (championship_id, round_number)
);

COMMENT ON TABLE public.round_summaries IS
  'Resumos de rodada gerados pela IA, visíveis a todos os membros da liga.';
COMMENT ON COLUMN public.round_summaries.round_number IS
  'Número da rodada (1, 2, 3...) — usado na unicidade junto ao campeonato.';
COMMENT ON COLUMN public.round_summaries.round_name IS
  'Nome legível da rodada (ex: "1ª Rodada", "Quartas de Final").';
COMMENT ON COLUMN public.round_summaries.content IS
  'Conteúdo Markdown do boletim gerado pela IA.';

ALTER TABLE public.round_summaries ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 2. POLÍTICAS RLS
-- =============================================================

-- SELECT: leitura pública (todos os membros e visitantes da liga).
CREATE POLICY "Leitura pública de resumos de rodada"
  ON public.round_summaries
  FOR SELECT
  USING (true);

-- INSERT: dono OU membro com papel EDITOR/ADMIN.
CREATE POLICY "Criador ou editor pode criar resumos de rodada (INSERT)"
  ON public.round_summaries
  FOR INSERT
  WITH CHECK (is_championship_editor(championship_id));

-- UPDATE: dono OU membro com papel EDITOR/ADMIN.
CREATE POLICY "Criador ou editor pode alterar resumos de rodada (UPDATE)"
  ON public.round_summaries
  FOR UPDATE
  USING (is_championship_editor(championship_id))
  WITH CHECK (is_championship_editor(championship_id));

-- DELETE: dono OU membro com papel EDITOR/ADMIN.
CREATE POLICY "Criador ou editor pode excluir resumos de rodada (DELETE)"
  ON public.round_summaries
  FOR DELETE
  USING (is_championship_editor(championship_id));
