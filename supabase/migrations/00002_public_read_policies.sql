-- =============================================================
-- MIGRAÇÃO: 00002_public_read_policies
-- Descrição: Habilita a LEITURA pública (visitantes anônimos) das
--            tabelas usadas na área pública de visualização do
--            campeonato. Apenas SELECT — nenhuma permissão de
--            escrita é concedida a usuários não donos.
-- =============================================================

-- CHAMPIONSHIPS
CREATE POLICY "Leitura pública de campeonatos"
  ON public.championships
  FOR SELECT
  USING (true);

-- SEASONS
CREATE POLICY "Leitura pública de temporadas"
  ON public.seasons
  FOR SELECT
  USING (true);

-- TEAMS
CREATE POLICY "Leitura pública de equipes"
  ON public.teams
  FOR SELECT
  USING (true);

-- PLAYERS
CREATE POLICY "Leitura pública de atletas"
  ON public.players
  FOR SELECT
  USING (true);

-- MATCHES
CREATE POLICY "Leitura pública de partidas"
  ON public.matches
  FOR SELECT
  USING (true);

-- ROUNDS
CREATE POLICY "Leitura pública de rodadas"
  ON public.rounds
  FOR SELECT
  USING (true);

-- MATCH_EVENTS
CREATE POLICY "Leitura pública de eventos de partida"
  ON public.match_events
  FOR SELECT
  USING (true);
