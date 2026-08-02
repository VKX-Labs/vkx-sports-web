-- =============================================================
-- MIGRAÇÃO: 00001_rls_policies
-- Descrição: Habilita RLS em todas as tabelas e cria políticas
--            de acesso baseadas na propriedade do campeonato.
-- =============================================================

-- 1. FUNÇÃO AUXILIAR: Verifica se o usuário autenticado é dono
--    do campeonato através do ID do campeonato.
CREATE OR REPLACE FUNCTION public.is_championship_owner(championship_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.championships
    WHERE id = championship_id
      AND user_id = auth.uid()
  );
$$;

-- 2. FUNÇÃO AUXILIAR: Verifica se o usuário é dono do campeonato
--    através do ID da temporada.
CREATE OR REPLACE FUNCTION public.is_season_owner(season_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.seasons s
    JOIN public.championships c ON c.id = s.championship_id
    WHERE s.id = season_id
      AND c.user_id = auth.uid()
  );
$$;

-- =============================================================
-- TABELA: championships
-- =============================================================
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê apenas seus próprios campeonatos
CREATE POLICY "Usuário pode ver seus próprios campeonatos"
  ON public.championships
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: usuário só pode criar campeonatos com seu próprio user_id
CREATE POLICY "Usuário pode criar seus próprios campeonatos"
  ON public.championships
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: usuário só pode alterar seus próprios campeonatos
CREATE POLICY "Usuário pode alterar seus próprios campeonatos"
  ON public.championships
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: usuário só pode excluir seus próprios campeonatos
CREATE POLICY "Usuário pode excluir seus próprios campeonatos"
  ON public.championships
  FOR DELETE
  USING (user_id = auth.uid());

-- =============================================================
-- TABELA: seasons
-- =============================================================
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso via propriedade do campeonato (SELECT)"
  ON public.seasons
  FOR SELECT
  USING (is_championship_owner(championship_id));

CREATE POLICY "Acesso via propriedade do campeonato (INSERT)"
  ON public.seasons
  FOR INSERT
  WITH CHECK (is_championship_owner(championship_id));

CREATE POLICY "Acesso via propriedade do campeonato (UPDATE)"
  ON public.seasons
  FOR UPDATE
  USING (is_championship_owner(championship_id))
  WITH CHECK (is_championship_owner(championship_id));

CREATE POLICY "Acesso via propriedade do campeonato (DELETE)"
  ON public.seasons
  FOR DELETE
  USING (is_championship_owner(championship_id));

-- =============================================================
-- TABELA: teams
-- =============================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso via temporada do campeonato (SELECT)"
  ON public.teams
  FOR SELECT
  USING (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (INSERT)"
  ON public.teams
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (UPDATE)"
  ON public.teams
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (DELETE)"
  ON public.teams
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: players
-- =============================================================
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso via temporada do campeonato (SELECT)"
  ON public.players
  FOR SELECT
  USING (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (INSERT)"
  ON public.players
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (UPDATE)"
  ON public.players
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (DELETE)"
  ON public.players
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: matches
-- =============================================================
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso via temporada do campeonato (SELECT)"
  ON public.matches
  FOR SELECT
  USING (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (INSERT)"
  ON public.matches
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (UPDATE)"
  ON public.matches
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (DELETE)"
  ON public.matches
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: rounds
-- =============================================================
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso via temporada do campeonato (SELECT)"
  ON public.rounds
  FOR SELECT
  USING (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (INSERT)"
  ON public.rounds
  FOR INSERT
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (UPDATE)"
  ON public.rounds
  FOR UPDATE
  USING (is_season_owner(season_id))
  WITH CHECK (is_season_owner(season_id));

CREATE POLICY "Acesso via temporada do campeonato (DELETE)"
  ON public.rounds
  FOR DELETE
  USING (is_season_owner(season_id));

-- =============================================================
-- TABELA: match_events
-- =============================================================
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Para match_events, precisamos verificar a propriedade através
-- de match -> season -> championship
CREATE OR REPLACE FUNCTION public.is_match_event_owner(match_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.match_events me
    JOIN public.matches m ON m.id = me.match_id
    JOIN public.seasons s ON s.id = m.season_id
    JOIN public.championships c ON c.id = s.championship_id
    WHERE me.match_id = match_id
      AND c.user_id = auth.uid()
  );
$$;

CREATE POLICY "Acesso via partida do campeonato (SELECT)"
  ON public.match_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.seasons s ON s.id = m.season_id
      JOIN public.championships c ON c.id = s.championship_id
      WHERE m.id = match_events.match_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Acesso via partida do campeonato (INSERT)"
  ON public.match_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.seasons s ON s.id = m.season_id
      JOIN public.championships c ON c.id = s.championship_id
      WHERE m.id = match_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Acesso via partida do campeonato (UPDATE)"
  ON public.match_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.seasons s ON s.id = m.season_id
      JOIN public.championships c ON c.id = s.championship_id
      WHERE m.id = match_events.match_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.seasons s ON s.id = m.season_id
      JOIN public.championships c ON c.id = s.championship_id
      WHERE m.id = match_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Acesso via partida do campeonato (DELETE)"
  ON public.match_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.seasons s ON s.id = m.season_id
      JOIN public.championships c ON c.id = s.championship_id
      WHERE m.id = match_events.match_id
        AND c.user_id = auth.uid()
    )
  );

-- =============================================================
-- STORAGE: Policies para buckets
-- =============================================================

-- Bucket: team-logos
-- INSERT: apenas usuários autenticados podem fazer upload
CREATE POLICY "Upload autenticado para logos de times"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'team-logos');

-- SELECT: qualquer pessoa pode ver logos (público)
CREATE POLICY "Leitura pública de logos de times"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'team-logos');

-- DELETE: apenas o dono pode excluir
CREATE POLICY "Dono pode excluir logo do time"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'team-logos');

-- Bucket: players
CREATE POLICY "Upload autenticado para fotos de jogadores"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'players');

CREATE POLICY "Leitura pública de fotos de jogadores"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'players');

CREATE POLICY "Dono pode excluir foto do jogador"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'players');
