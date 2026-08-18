-- =============================================================
-- MIGRAÇÃO: 00010_walkover_fields
-- Descrição: Suporte a campos de W.O. (Walkover) na tabela
--            matches para rastrear ausências e cálculo correto
--            de pontuação na classificação.
--
--  1. Coluna is_wo (boolean) — indica se a partida é W.O.
--  2. Coluna wo_type (text) — tipo: 'home', 'away' ou 'double'
-- =============================================================

-- =============================================================
-- 1. FLAG DE W.O.
-- =============================================================
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS is_wo boolean DEFAULT false;

COMMENT ON COLUMN public.matches.is_wo IS
  'Indica se a partida foi decidida por W.O. (ausência de time).';

-- =============================================================
-- 2. TIPO DE W.O.
-- =============================================================
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS wo_type text;

COMMENT ON COLUMN public.matches.wo_type IS
  'Tipo de W.O.: "home" (mandante ausente), "away" (visitante ausente) ou "double" (ambos ausentes).';
