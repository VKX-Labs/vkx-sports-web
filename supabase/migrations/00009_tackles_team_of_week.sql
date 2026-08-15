-- =============================================================
-- MIGRAÇÃO: 00009_tackles_team_of_week
-- Descrição: Suporte ao evento de desarme (TACKLE) nas
--            estatísticas e persistência da "Seleção da Rodada"
--            (11 Ideal) gerada pela IA.
--
--  1. Coluna tackles em match_player_stats (desarmes por partida).
--  2. Coluna team_of_week (jsonb) em round_summaries com o 11
--     Ideal salvo, visível no dashboard e na área pública.
-- =============================================================

-- =============================================================
-- 1. DESARMES POR PARTIDA
-- =============================================================
ALTER TABLE public.match_player_stats
  ADD COLUMN IF NOT EXISTS tackles int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.match_player_stats.tackles IS
  'Quantidade de desarmes (eventos TACKLE) do atleta na partida.';

-- =============================================================
-- 2. SELEÇÃO DA RODADA (11 IDEAL) EM round_summaries
-- =============================================================
ALTER TABLE public.round_summaries
  ADD COLUMN IF NOT EXISTS team_of_week jsonb;

COMMENT ON COLUMN public.round_summaries.team_of_week IS
  'Seleção da Rodada (11 Ideal + reservas + craque) gerada pela IA e salva em JSON.';
