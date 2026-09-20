-- =============================================================
-- MIGRAÇÃO: 00018_add_second_striker_position
-- Descrição:
--   Corrige a violação de CHECK constraint `players_position_check`
--   ao salvar atleta com a posição "Segundo Atacante" (SEGUNDO_ATACANTE).
--
--   O frontend (src/types/player.ts), o validador Zod
--   (src/validators/player.schema.ts) e os formulários (PlayerForm e
--   EditPlayerModal) já enviam a chave SEGUNDO_ATACANTE. Esta migration
--   garante que a restrição do banco aceite esse valor, alinhando o
--   schema do Supabase com a lista canônica do projeto.
--
--   Lista canônica (11 posições):
--   GOLEIRO, ZAGUEIRO, LATERAL_DIREITO, LATERAL_ESQUERDO, VOLANTE,
--   MEIA_DE_LIGACAO, MEIA_ATACANTE, PONTA_DIREITA, PONTA_ESQUERDA,
--   SEGUNDO_ATACANTE, CENTROAVANTE
-- =============================================================

-- =============================================================
-- 1. NORMALIZAÇÃO DE DADOS LEGADOS
--    MEIA_CENTRAL (descontinuada) -> MEIA_DE_LIGACAO
-- =============================================================
UPDATE public.players
SET position = 'MEIA_DE_LIGACAO'
WHERE position = 'MEIA_CENTRAL';

-- =============================================================
-- 2. RECRIAR A CONSTRAINT COM A LISTA CANÔNICA
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