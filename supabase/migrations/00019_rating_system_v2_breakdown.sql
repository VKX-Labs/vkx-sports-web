-- =============================================================
-- MIGRAÇÃO: 00019_rating_system_v2_breakdown
-- Descrição: Detalhamento da nota VKX V2 no motor de notas por partida.
--
--  1. Coluna rating_breakdown (jsonb) em match_player_stats: guarda a
--     composição individual da nota (base, resultado, gols, assistências,
--     defesas, índice defensivo coletivo, gols sofridos e cartões) para
--     permitir recálculo transparente e sem perdas.
--  2. As colunas numéricas já existentes (goals, assists, yellow_cards,
--     red_cards, saves, tackles) passam a ser preenchidas pelo motor.
-- =============================================================

ALTER TABLE public.match_player_stats
  ADD COLUMN IF NOT EXISTS rating_breakdown jsonb;

COMMENT ON COLUMN public.match_player_stats.rating_breakdown IS
  'Composição detalhada da nota VKX V2 (base, resultado, gols, assistências, defesas, desarmes do time, índice defensivo, gols sofridos, cartões e G+A). Preenchida pelo motor determinístico.';