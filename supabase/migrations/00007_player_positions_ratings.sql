-- =============================================================
-- MIGRAÇÃO: 00007_player_positions_ratings
-- Descrição: Suporte completo a posições do futebol e sistema de
--            notas dos atletas.
--
--  1. Constraint CHECK com as posições oficiais em players.
--  2. Coluna average_rating em players (nota média da temporada).
--  3. Tabela match_player_stats (estatística/nota por partida)
--     com rating, caso ainda não exista.
--  4. RLS de match_player_stats (idempotente).
--  5. Trigger que recalcula players.average_rating a partir das
--     notas gravadas em match_player_stats.
-- =============================================================

-- =============================================================
-- 1. POSIÇÕES: GOLEIRO a CENTROAVANTE
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
      'MEIA_ATACANTE',
      'PONTA_DIREITA',
      'PONTA_ESQUERDA',
      'CENTROAVANTE'
    )
  );

COMMENT ON COLUMN public.players.position IS
  'Posição do atleta: GOLEIRO, ZAGUEIRO, LATERAL_DIREITO, LATERAL_ESQUERDO, VOLANTE, MEIA_ATACANTE, PONTA_DIREITA, PONTA_ESQUERDA, CENTROAVANTE.';

-- =============================================================
-- 2. NOTA MÉDIA POR JOGADOR
-- =============================================================
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS average_rating numeric(3,1);

COMMENT ON COLUMN public.players.average_rating IS
  'Média das notas das partidas do atleta na temporada (0.0 a 10.0). Atualizada por trigger.';

-- =============================================================
-- 3. TABELA: match_player_stats (estatística/nota por partida)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.match_player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  yellow_cards int NOT NULL DEFAULT 0,
  red_cards int NOT NULL DEFAULT 0,
  saves int NOT NULL DEFAULT 0,
  rating numeric(3,1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_player_stats_match_player_unique UNIQUE (match_id, player_id)
);

COMMENT ON TABLE public.match_player_stats IS
  'Estatísticas e nota individual de cada atleta por partida.';
COMMENT ON COLUMN public.match_player_stats.rating IS
  'Nota do atleta na partida (0.0 a 10.0).';

-- =============================================================
-- 4. RLS: match_player_stats
-- =============================================================
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;

-- Leitura pública (consistente com as demais tabelas de conteúdo).
CREATE POLICY "Leitura pública de stats de partida"
  ON public.match_player_stats
  FOR SELECT
  USING (true);

-- Escrita: dono OU EDITOR/ADMIN via is_match_editor.
CREATE POLICY "Criador ou editor pode criar stats (INSERT)"
  ON public.match_player_stats
  FOR INSERT
  WITH CHECK (is_match_editor(match_id));

CREATE POLICY "Criador ou editor pode alterar stats (UPDATE)"
  ON public.match_player_stats
  FOR UPDATE
  USING (is_match_editor(match_id))
  WITH CHECK (is_match_editor(match_id));

CREATE POLICY "Criador ou editor pode excluir stats (DELETE)"
  ON public.match_player_stats
  FOR DELETE
  USING (is_match_editor(match_id));

-- =============================================================
-- 5. TRIGGER: sincroniza players.average_rating
-- =============================================================
CREATE OR REPLACE FUNCTION public.sync_player_average_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.players p
  SET average_rating = (
    SELECT ROUND(AVG(mps.rating)::numeric, 1)
    FROM public.match_player_stats mps
    WHERE mps.player_id = NEW.player_id
      AND mps.rating IS NOT NULL
  )
  WHERE p.id = NEW.player_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_player_average_rating ON public.match_player_stats;

CREATE TRIGGER trg_sync_player_average_rating
AFTER INSERT OR UPDATE OF rating ON public.match_player_stats
FOR EACH ROW
EXECUTE FUNCTION public.sync_player_average_rating();
