# Expansão do Formato Copa / Mata-Mata — VKX Sports

## Resumo

Esta implementação torna o formato **COPA / MATA_MATA** 100% funcional, visual e flexível:
- o **dispatcher** agora encaminha `COPA` e `MATA_MATA` obrigatoriamente para o gerador de mata-mata;
- o **sorteio** das chaves é opcionalmente aleatório (`shuffle`);
- o mapeamento de fases é automático conforme o número de equipes;
- o organizador pode **classificar equipes manualmente** (tribunal, punição, W.O. especial) direto no Match Center;
- a Classificação abre por padrão no **BracketView** (chaveamento em árvore) para copas;
- os **nomes das fases** são amigáveis em todos os filtros e navegações.

---

## 1. Gerador de Torneio e Sorteio Aleatório

### `src/utils/generators/bracket.ts`

- Adicionado o parâmetro opcional `shuffle: boolean = false` em `generateKnockoutBracket`.
- Nova função `shuffleTeams` (Fisher–Yates) que embaralha a ordem das equipes **antes** de alocá-las nos confrontos da fase inicial.
- O mapeamento de fases já existente foi validado e mantido:

| Equipes | Fase inicial            | Partidas na fase inicial |
| ------- | ----------------------- | ------------------------ |
| 16      | `OITAVAS`               | 8                        |
| 8       | `QUARTAS`               | 4                        |
| 4       | `SEMI`                  | 2                        |
| 2       | `FINAL`                 | 1                        |
| N não-potência de 2 (ex.: 12) | `PRE_PLAYOFF` com *byes* automáticos | 4 (exemplo) |

- O encadeamento `next_match_index` (partidas 0,1 → próxima 0; 2,3 → próxima 1; ...) foi validado, inclusive para o caso de *byes*.

### `src/repositories/tournament-generator.repository.ts`

- **Dispatcher (`generateTournament`)**: agora desvia para `generateKnockoutTournament` quando o tipo for `COPA` **ou** `MATA_MATA` (antes apenas `MATA_MATA`; `COPA` caía em pontos corridos).
- `generateKnockoutTournament`:
  - recebe `options.shuffle` e repassa ao gerador (`generateKnockoutBracket(teams, options.shuffle ?? false)`);
  - grava o tipo canônico na temporada preservando a escolha do usuário (`COPA` ou `MATA_MATA`), em vez de forçar `MATA_MATA`;
  - cria as rodadas (rounds) com **nomes amigáveis** das fases (ex.: `Oitavas de Final`) via `getPhaseDisplayName`, mantendo o mapa interno por fase crua para associar as partidas.
- `src/app/dashboard/campeonatos/[id]/jogos/hooks/useTournamentGenerator.ts`: `isKnockout` agora considera também `COPA`, enviando as regras de mata-mata (idas e voltas, pênaltis, 3º lugar) para o gerador.

---

## 2. Override / Controle Manual do Avanço de Equipes

### `src/services/bracketEngine.ts`

- Extraída a lógica de resolução do destino em `resolveAdvanceTarget(match)`, compartilhada entre o avanço automático e o manual:
  - usa `next_match_id` quando disponível;
  - *fallback* por fase seguinte (`NEXT_PHASE_MAP`) + `bracket_position` (corrigido `Math.ceil` → `Math.floor` para posições base-0);
  - determina o slot `home`/`away` pela paridade de `bracket_position` (mesma convenção do avanço automático).
- Nova função **`forceAdvanceWinner(matchId, winnerTeamId)`**:
  1. busca a partida;
  2. valida que o vencedor é um dos participantes;
  3. grava `winner_id` na partida atual;
  4. atualiza o slot (`home_team_id` ou `away_team_id`) da partida em `next_match_id`, propagando a equipe no chaveamento.

### `src/repositories/match.repository.ts`

- Novo método `forceAdvanceWinner(matchId, winnerTeamId)` com `assertMatchEditor` (autorização) delegando ao motor do bracket.

### `src/services/matchService.ts`

- Novo método `forceAdvanceWinner(matchId, winnerTeamId)` que delega ao repositório (camada usada pelas páginas).

### Match Center — `src/components/match/ManualAdvanceCard.tsx` (novo) + página

- Novo componente **`ManualAdvanceCard`**: card "Classificação Manual (Avanço)" com um botão por equipe.
  - Ao clicar, confirma, chama `MatchService.forceAdvanceWinner`, exibe feedback e recarrega os dados.
  - Destaca em verde a equipe já marcada como vencedora (`winner_id`).
- `src/app/dashboard/campeonatos/[id]/jogos/[matchId]/page.tsx`:
  - renderiza o `ManualAdvanceCard` quando o usuário tem permissão, a partida é de fase eliminatória (`phase` preenchida e ≠ `REGULAR`) e há dois times definidos;
  - extraído `refreshMatchData` para recarregar a partida após o avanço manual.

---

## 3. UI Especializada para Copa / Mata-Mata

### `src/types/tournament.ts`

- `PHASE_NAMES` atualizado para nomes amigáveis exigidos:

| Fase (valor cru) | Nome exibido           |
| ---------------- | ---------------------- |
| `16_AVOS`        | 16avos de Final        |
| `OITAVAS`        | Oitavas de Final       |
| `QUARTAS`        | Quartas de Final       |
| `SEMI`           | Semifinais             |
| `FINAL`          | Grande Final           |
| `THIRD_PLACE` / `TERCEIRO_LUGAR` | Disputa de 3º Lugar |

- Novos aliases no tipo `PlayoffPhase` (`THIRD_PLACE`, `SEMIFINAL`, `SEMIFINAIS`).
- Nova função utilitária **`getPhaseDisplayName(value)`** usada em filtros e navegações.

### `src/hooks/useClassificacao.ts` + `src/app/dashboard/campeonatos/[id]/classificacao/page.tsx`

- A tela de Classificação agora abre **diretamente no `BracketView`** quando a temporada é `COPA` ou `MATA_MATA`.
- No `page.tsx`:
  - `isOnlyKnockout` inclui `COPA` (esconde a aba de tabela e força o chaveamento);
  - `isGroupFormat` fica restrito a `GRUPOS_MATA_MATA`;
  - `handleTournamentTypeChange` abre o bracket para `COPA`/`MATA_MATA`.

### `src/services/roundFilterService.ts`

- `getFilterOptions` reescrito: para `MATA_MATA` e `COPA` retorna as fases reais (incluindo `PRE_PLAYOFF`, `16_AVOS`, `THIRD_PLACE`) na ordem correta, com **nomes amigáveis** via `PHASE_NAMES`, conforme o número de equipes.

### Navegação de partidas (Dashboard e Área Pública)

- `src/app/dashboard/campeonatos/[id]/jogos/page.tsx` e `src/app/(public)/[championshipSlug]/jogos/page.tsx`:
  - os nomes das rodadas/fases são exibidos via `getPhaseDisplayName` (cobre tanto os dados novos quanto dados antigos gravados com a fase crua, ex.: `OITAVAS` → `Oitavas de Final`).

---

## 4. Sistema Ida e Volta (Jogos de Ida e Volta)

### `src/types/tournament.ts`

- Novo tipo **`MatchLeg`**: `"IDA" | "VOLTA" | "UNICO"`.
- Nova função **`getPhaseRoundName(phase, leg)`**: monta o nome da rodada de uma perna:
  - `getPhaseRoundName("OITAVAS", "IDA")` → `Oitavas de Final - Ida`;
  - `getPhaseRoundName("OITAVAS", "VOLTA")` → `Oitavas de Final - Volta`;
  - sem perna → `Oitavas de Final`.
- Novas funções **`getLegLabel(leg)`** e **`inferLegFromRoundName(name)`** (deriva `IDA`/`VOLTA`/`UNICO` a partir do nome da rodada).
- `RoundFilterOption` ganha o campo opcional `leg`.

### `src/utils/generators/bracket.ts`

- Extraída a função **`getBracketStructure(numTeams)`** (retorna `{ phase, matchCount }[]`), compartilhada entre o gerador e o `RoundFilterService` (evita duplicação da matemática das fases).

### `src/repositories/tournament-generator.repository.ts`

- `generateKnockoutTournament` agora cria **duas rodadas por fase** quando a fase é de ida e volta (`isPhaseTwoLegged` via `knockoutRules`, ou `options.twoLegged` global):
  - rodada **Ida** com nome `"{Fase} - Ida"` e rodada **Volta** com nome `"{Fase} - Volta"`, ambas com `round_number` sequencial;
  - o mapa interno passa a ser chaveado por `"{phase}::{leg}"` (`IDA`/`VOLTA`/`UNICO`).
- Cada confronto gera **dois jogos**:
  - **Ida** (`home` = time A, `away` = time B) na rodada Ida;
  - **Volta** (`home` = time B, `away` = time A) na rodada Volta.
- O `next_match_id` do jogo de **Volta** agora aponta para **o mesmo destino** do jogo de Ida (partida da fase seguinte), conforme especificado.

### `src/services/roundFilterService.ts`

- `getKnockoutPhases` passa a usar `getBracketStructure`.
- Novo método **`getKnockoutBracketSizes(totalTeams)`** → `{ fase: nº de confrontos }` (usado para montar as opções de posição na chave).
- `getFilterOptions(..., hasTwoLegs)` com `hasTwoLegs = true` retorna as fases divididas em opções **`"{Fase} - Ida"`** e **`"{Fase} - Volta"`** (categoria `SPLIT`, com `leg` correspondente).

### `src/repositories/match.repository.ts`

- `createManualMatch` aceita agora `phase` e `bracketPosition` (persiste `phase` e `bracket_position`).
- `updateMatch` aceita agora `phase`, `bracketPosition` e `roundId`.

### Modais de Criar / Editar Jogo — `jogos/components/CreateMatchModal.tsx` e `EditMatchModal.tsx`

- Quando o campeonato é `COPA`/`MATA_MATA` (`isKnockout`), os modais exibem três novos campos:
  - **Fase** (lista de fases amigáveis conforme nº de equipes);
  - **Posição na chave** (número de confrontos da fase selecionada via `bracketSizes`);
  - **Perna / Tipo** (`Jogo de Ida`, `Jogo de Volta`, `Jogo Único`).
- `CreateMatchPayload`/`EditMatchPayload` passam a incluir `phase`, `bracketPosition` e `leg`. O `leg` é usado para resolver a rodada correta (`- Ida`, `- Volta` ou sem sufixo).

### `src/app/dashboard/campeonatos/[id]/jogos/hooks/useRodadasPageController.ts`

- Busca a temporada (id + `tournament_type`) e expõe:
  - `isKnockoutTournament` (`COPA`/`MATA_MATA`);
  - `phaseOptions` (via `RoundFilterService.getFilterOptions`);
  - `bracketSizes` (via `RoundFilterService.getKnockoutBracketSizes`).
- Novo helper `resolveRoundId(phase, leg)`: localiza a rodada pelo nome (`getPhaseRoundName`) nas rodadas carregadas; se não existir, **cria a rodada** on demand (`MatchRepository.createRound`).
- `handleCreateMatch`/`handleUpdateMatch` recebem o payload estendido e resolvem a rodada correta quando o torneio é eliminatório.

### `src/app/dashboard/campeonatos/[id]/jogos/page.tsx`

- Subtítulo do cabeçalho:
  - `COPA`/`MATA_MATA` → **"Fase Eliminatória"**;
  - outros torneios em fase eliminatória → "Fase Eliminatória (Mata-Mata)";
  - fase de classificação → "Fase de Classificação / Grupos".
- O seletor de rodadas continua exibindo nomes amigáveis (`getPhaseDisplayName`), agora cobrindo também `"{Fase} - Ida"` / `"{Fase} - Volta"`.
- `onEdit` do `MatchCard` deriva o `leg` da rodada atual (`inferLegFromRoundName`) e repassa `phase`/`bracket_position` ao `EditMatchModal`.

---

## 5. Fluxo e Execução do Gerador Automático de Torneios

### `src/app/dashboard/campeonatos/[id]/jogos/components/GeneratorOptionsModal.tsx` (novo)

- Novo modal **`GeneratorOptionsModal`** que permite configurar e executar o gerador:
  - **Sorteio / Shuffle** (`Embaralhar equipes antes de gerar`);
  - **Ida e Volta** para torneios `COPA`/`MATA_MATA` — ativa `two_legged` em todas as fases do `knockoutRules` (gera rodadas `"{Fase} - Ida"`/`"{Fase} - Volta"`);
  - **Turno e Returno** (`doubleRound`) para pontos corridos;
  - status de equipes cadastradas (mínimo 2) com aviso amigável;
  - botão **"Gerar Confrontos"** com estado de carregamento (`Gerando...`).

### `src/app/dashboard/campeonatos/[id]/jogos/page.tsx`

- Botão **"Gerar Tabela / Confrontos Automáticos"** visível e acessível em 3 lugares:
  - no estado vazio (sem rodadas), junto ao "Criar Primeira Rodada";
  - no corpo de uma rodada sem partidas ("Gerar Confrontos Automáticos");
  - no cabeçalho (botão compacto "Gerar").
- O modal é renderizado tanto no estado vazio quanto na tela principal, abrindo direto para configurar as regras e rodar o gerador.

### `src/app/dashboard/campeonatos/[id]/jogos/hooks/useRodadasLocal.ts` + `useRodadasPageController.ts`

- `useRodadasLocal` passa a expor o objeto `generator` e o `handleGenerate` (gera + refetch das rodadas).
- O controller repassa `generator`, `handleGenerate` e `tournamentType` para a página.

### `src/app/dashboard/campeonatos/[id]/jogos/hooks/useTournamentGenerator.ts`

- No `generate`:
  - recontagem **fresca** das equipes (`refreshTeamCount`) antes de iniciar, com alerta amigável se houver menos de 2;
  - `try/catch` detalhado logando `message`/`details`/`hint`/`code`;
  - retorno booleano de sucesso.

### `src/repositories/tournament-generator.repository.ts`

- `generateKnockoutTournament` envolvido em `try/catch` com log detalhado (`message`/`details`/`hint`/`code`) re-lançando o erro para a UI.
- Erros de **inserção de rodadas** (`rounds`) agora logam e **lançam** erro (antes eram ignorados, gerando partidas sem `round_id`).
- Erros de exclusão prévia de `matches`/`rounds` e de inserção de `matches` também são logados com detalhes.
- Validação de equipes (mínimo 2) mantida antes de iniciar a geração.

### Atualização automática da tela (sem F5)

- Após a geração, `useRodadasLocal.handleGenerate` executa `fetchRoundsAndMatches()` e o `useEffect` dependente de `generator.hasRounds` também dispara o refetch — a tela recarrega as rodadas "Oitavas de Final - Ida"/"- Volta" imediatamente após confirmar o gerador.

---

## Validação Executada

1. **`npx tsc --noEmit`**: sem erros de tipo.
2. **Teste do gerador** (script Node com `--experimental-strip-types`):
   - 16 times → `OITAVAS: 8`, `QUARTAS: 4`, `SEMI: 2`, `FINAL: 1` (total 15 partidas);
   - 8 times → `QUARTAS: 4`, `SEMI: 2`, `FINAL: 1`;
   - 4 times → `SEMI: 2`, `FINAL: 1`;
   - 2 times → `FINAL: 1`;
   - 12 times → `PRE_PLAYOFF: 4`, `QUARTAS: 4`, `SEMI: 2`, `FINAL: 1` com *byes* distribuídos nos slots (`T8–T11` em QUARTAS) e `next_match_index` corretos;
   - 32 times → `16_AVOS: 16`, `OITAVAS: 8`, ...;
   - `shuffle: true` gera ordens diferentes a cada chamada.
3. **Teste do sistema Ida e Volta** (script Node via `tsx`):
   - `getBracketStructure` consistente (16, 8, 12, 32);
   - `getPhaseRoundName`/`inferLegFromRoundName`/`getPhaseDisplayName` corretos;
   - plano de rodadas de ida e volta (16 times, fases em ida e volta) gera `Oitavas de Final - Ida | Oitavas de Final - Volta | ... | Grande Final - Volta`;
   - `RoundFilterService.getFilterOptions("COPA", 16, true)` retorna opções `- Ida`/`- Volta`;
   - `RoundFilterService.getKnockoutBracketSizes(16)` → `OITAVAS: 8, QUARTAS: 4, SEMI: 2, FINAL: 1` (e 8 times sem `OITAVAS`);
   - os dois jogos da semifinal apontam para a mesma Grande Final (destino compartilhado).

## Como testar o gerador automático (fluxo completo)

1. Em um campeonato **Copa**, apague as rodadas existentes (ou crie sem rodadas).
2. Na tela de **Jogos**, clique em **"Gerar Tabela / Confrontos Automáticos"** (estado vazio, rodada sem jogos ou botão "Gerar" do cabeçalho).
3. No modal, confira o status de equipes, marque **"Embaralhar equipes antes de gerar (Sorteio)"** e **"Ida e Volta"**.
4. Clique em **"Gerar Confrontos"** e confirme o aviso.
5. Sem dar F5, valide que as rodadas **"Oitavas de Final - Ida"** e **"Oitavas de Final - Volta"** aparecem renderizadas imediatamente na tela, com as partidas correspondentes.
6. Com menos de 2 equipes, o gerador exibe o alerta amigável e não inicia a geração.

## Como testar no app

1. Crie um campeonato com temporada e cadastre **16 equipes**.
2. Em **Jogos**, selecione o formato **Formato Copa** (ou **Apenas Mata-Mata**) e marque **"Embaralhar equipes antes de gerar"**, depois gere a tabela.
3. Confirme que a fase inicial é **Oitavas de Final** com 8 partidas e confrontos em ordem aleatória.
4. Na aba **Classificação**, o chaveamento (BracketView) abre por padrão.
5. Abra uma partida no **Match Center**, finalize o placar e veja o vencedor subir automaticamente no chaveamento; ou use **"Classificação Manual (Avanço)"** para forçar uma equipe e confira a propagação no bracket.

## Como testar o Ida e Volta e a gestão manual no chaveamento

1. No gerador (formato Copa/Mata-Mata), marque **"Ida e Volta"** (regras por fase com `two_legged`) e gere com **16 equipes**.
2. Na tela de **Jogos**, confirme que as abas/rodadas ficam **"Oitavas de Final - Ida"** e **"Oitavas de Final - Volta"** (e assim por diante) e que o subtítulo exibe **"Fase Eliminatória"**.
3. Verifique que cada confronto tem dois jogos (Ida com `home A / away B` e Volta com `home B / away A`).
4. Clique em **Adicionar Jogo** e, para um torneio Copa/Mata-Mata, selecione **Fase**, **Posição na chave** e **Perna/Tipo** (ex.: `Oitavas de Final`, `Confronto 2`, `Jogo de Volta`).
5. Salve e abra a aba **Classificação** — o jogo manual deve aparecer no card correspondente do **BracketView** (mesma fase + posição).
