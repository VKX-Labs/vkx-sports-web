-- =============================================================
-- MIGRAÇÃO: 00006_round_summaries_fix
-- Descrição: Garante a criação da tabela round_summaries no banco
--            remoto. A migração 00005 já definia a tabela, mas o
--            schema cache retornou "Could not find the table
--            'public.round_summaries'", ou seja, ela ainda não foi
--            aplicada. Esta migração é idempotente (IF NOT EXISTS /
--            DROP POLICY IF EXISTS) e pode ser reaplicada com
--            segurança mesmo se 00005 já tiver sido executada.
-- =============================================================

-- =============================================================
-- 1. TABELA: round_summaries
-- =============================================================
CREATE TABLE IF NOT EXISTS public.round_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  championship_id UUID NOT NULL,
  round_number INT NOT NULL,
  round_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_championship_round UNIQUE (championship_id, round_number)
);

ALTER TABLE public.round_summaries ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 2. POLÍTICAS RLS
-- =============================================================

-- Remove eventuais políticas criadas pela 00005 para evitar
-- duplicação ao reaplicar a migração.
DROP POLICY IF EXISTS "Leitura pública de resumos de rodada" ON public.round_summaries;
DROP POLICY IF EXISTS "Criador ou editor pode criar resumos de rodada (INSERT)" ON public.round_summaries;
DROP POLICY IF EXISTS "Criador ou editor pode alterar resumos de rodada (UPDATE)" ON public.round_summaries;
DROP POLICY IF EXISTS "Criador ou editor pode excluir resumos de rodada (DELETE)" ON public.round_summaries;

-- Leitura pública.
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.round_summaries;
CREATE POLICY "Permitir leitura para todos" ON public.round_summaries
  FOR SELECT USING (true);

-- Escrita para usuários autenticados.
DROP POLICY IF EXISTS "Permitir escrita para autenticados" ON public.round_summaries;
CREATE POLICY "Permitir escrita para autenticados" ON public.round_summaries
  FOR ALL USING (auth.role() = 'authenticated');
