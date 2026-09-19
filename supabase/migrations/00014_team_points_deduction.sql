-- =============================================================
-- MIGRAÇÃO: 00014_team_points_deduction
-- Descrição: Sistema de Dedução de Pontos (Punição/STJD).
--
--  1. Coluna points_deducted na tabela teams (integer, padrão 0).
--     A classificação é calculada a partir da tabela teams (uma
--     linha por equipe por temporada), então a punição é aplicada
--     por equipe e refletida no cálculo de pontos da tabela.
-- =============================================================

ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS points_deducted integer DEFAULT 0;

COMMENT ON COLUMN public.teams.points_deducted IS
  'Pontos deduzidos da equipe na classificação (punição/STJD). 0 = sem punição.';