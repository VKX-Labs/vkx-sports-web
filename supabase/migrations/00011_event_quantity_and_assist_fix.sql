-- =============================================================
-- MIGRAÇÃO: 00011_event_quantity_and_assist_fix
-- Descrição:
--  1. Coluna quantity em match_events para registrar quantas
--     ocorrências um evento representa (ex: 5 defesas).
--  2. Atualização da constraint de posições para incluir
--     MEIA_CENTRAL e SEGUNDO_ATACANTE.
--  3. Atualização da função de leaderboard para contar
--     assistências vinculadas a eventos de gol (assist_player_id
--     em GOAL).
-- =============================================================

-- =============================================================
-- 1. QUANTIDADE POR EVENTO
-- =============================================================
ALTER TABLE public.match_events
  ADD COLUMN IF NOT EXISTS quantity int NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.match_events.quantity IS
  'Quantidade de ocorrências deste evento (ex: 5 defesas de goleiro). Padrão 1.';

-- =============================================================
-- 2. POSIÇÕES: adicionar MEIA_CENTRAL e SEGUNDO_ATACANTE
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
      'MEIA_CENTRAL',
      'MEIA_ATACANTE',
      'PONTA_DIREITA',
      'PONTA_ESQUERDA',
      'SEGUNDO_ATACANTE',
      'CENTROAVANTE'
    )
  );

COMMENT ON COLUMN public.players.position IS
  'Posição do atleta: GOLEIRO, ZAGUEIRO, LATERAL_DIREITO, LATERAL_ESQUERDO, VOLANTE, MEIA_CENTRAL, MEIA_ATACANTE, PONTA_DIREITA, PONTA_ESQUERDA, SEGUNDO_ATACANTE, CENTROAVANTE.';

-- =============================================================
-- 3. FUNÇÃO: Leaderboard de assistências (inclui assist_player_id
--    de eventos GOAL, não apenas eventos ASSIST avulsos)
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_assists_leaderboard(p_season_id uuid)
RETURNS TABLE (
  player_id uuid,
  player_name text,
  photo_url text,
  team_name text,
  team_badge text,
  total bigint
)
LANGUAGE sql STABLE
AS $$
  WITH assist_from_goals AS (
    SELECT
      me.assist_player_id AS pid,
      COALESCE(me.quantity, 1) AS qty
    FROM public.match_events me
    JOIN public.matches m ON m.id = me.match_id
    WHERE me.type = 'GOAL'
      AND me.assist_player_id IS NOT NULL
      AND (m.season_id = p_season_id
           OR m.round_id IN (
             SELECT r.id FROM public.rounds r WHERE r.season_id = p_season_id
           ))
  ),
  standalone_assists AS (
    SELECT
      me.player_id AS pid,
      COALESCE(me.quantity, 1) AS qty
    FROM public.match_events me
    JOIN public.matches m ON m.id = me.match_id
    WHERE me.type = 'ASSIST'
      AND (m.season_id = p_season_id
           OR m.round_id IN (
             SELECT r.id FROM public.rounds r WHERE r.season_id = p_season_id
           ))
  ),
  combined AS (
    SELECT pid, qty FROM assist_from_goals
    UNION ALL
    SELECT pid, qty FROM standalone_assists
  )
  SELECT
    c.pid AS player_id,
    p.name AS player_name,
    p.photo_url,
    t.name AS team_name,
    t.badge_url AS team_badge,
    SUM(c.qty) AS total
  FROM combined c
  JOIN public.players p ON p.id = c.pid
  LEFT JOIN public.teams t ON t.id = p.team_id
  GROUP BY c.pid, p.name, p.photo_url, t.name, t.badge_url
  ORDER BY total DESC;
$$;
