# Sistema de Notas VKX V2

Motor determinístico de notas por partida (estilo Sofascore) que **não**
depende de IA: é uma função pura dos eventos cadastrados (`match_events`) e do
resultado de cada partida. Substitui a V1, corrigindo o impacto exagerado dos
goleiros e adicionando pesos por posição com tetos (caps) para evitar
inflação.

---

## 1. Tabela de pesos por posição

Nota base: **6.50** — intervalo final: **3.00 a 10.00** (uma casa decimal).

### 1.1 Resultado da partida

| Resultado | Bônus |
| --------- | ----- |
| Vitória   | +0.30 |
| Empate    | 0.00  |
| Derrota   | -0.30 |

> O resultado é derivado apenas da comparação de placares. Não existe bônus
> direto de "gols do time" (foi removido da V1 para evitar duplicação de
> pontuação com o bônus de gols individuais).

### 1.2 Gols — peso por posição (teto total **+2.40**)

| Posição                                | Peso por gol |
| -------------------------------------- | ------------ |
| Goleiro (GOLEIRO)                      | +1.20        |
| Zagueiro (ZAGUEIRO)                    | +0.90        |
| Lateral (LATERAL_DIREITO/ESQUERDO)     | +0.75        |
| Volante (VOLANTE)                      | +0.70        |
| Meia (MEIA_DE_LIGACAO/MEIA_ATACANTE)   | +0.70        |
| Ponta (PONTA_DIREITA/ESQUERDA)         | +0.80        |
| Atacante/2º Atacante (CENTROAVANTE/SEGUNDO_ATACANTE) | +0.80 |

O bônus total de gols de um atleta na partida não ultrapassa **+2.40**,
independentemente de quantos gols ele marcou.

### 1.3 Assistências — peso por posição (teto total **+1.50**)

| Posição                                | Peso por assistência |
| -------------------------------------- | --------------------- |
| Goleiro (GOLEIRO)                      | +0.90                 |
| Zagueiro (ZAGUEIRO)                    | +0.65                 |
| Lateral (LATERAL_DIREITO/ESQUERDO)     | +0.65                 |
| Volante (VOLANTE)                      | +0.60                 |
| Meia (MEIA_DE_LIGACAO/MEIA_ATACANTE)   | +0.75                 |
| Ponta (PONTA_DIREITA/ESQUERDA)         | +0.75                 |
| Atacante/2º Atacante (CENTROAVANTE/SEGUNDO_ATACANTE) | +0.65 |

O bônus total de assistências não ultrapassa **+1.50**.

> Assistência conta também quando um gol tem `assist_player_id` preenchido
> (evento `GOAL`), além do evento avulso `ASSIST`.

### 1.4 Índice Defensivo Coletivo (desarmes)

Analogia com a "pressão defensiva do time": desarmes coletados pelo time na
partida divididos pela **média de desarmes do campeonato** (por lado de time).
O quociente é limitado a **1.0** e multiplicado pelo teto da posição:

```
índice = min(1, desarmes_do_time / média_do_campeonato)
bônus  = teto_da_posição × índice
```

| Posição                         | Teto do bônus |
| ------------------------------- | ------------- |
| Goleiro (GOLEIRO)               | 0.00          |
| Zagueiro (ZAGUEIRO)             | +0.20         |
| Lateral (LATERAL_DIREITO/ESQUERDO) | +0.15      |
| Volante (VOLANTE)               | +0.20         |
| Meia (MEIA_DE_LIGACAO/MEIA_ATACANTE) | +0.10  |
| Ponta (PONTA_DIREITA/ESQUERDA)  | +0.05         |
| Atacante/2º Atacante            | +0.03         |

Média do campeonato = `total de desarmes da temporada / (nº de partidas
finalizadas × 2)`. Sem partidas finalizadas ou sem desarmes registrados, o
bônus é zero.

### 1.5 Goleiro — defesas com retornos decrescentes (teto **+0.80**)

A 1ª, 2ª e 3ª defesa valem `+0.05` cada; da 4ª à 6ª valem `+0.07` cada; da 7ª
em diante valem `+0.08` cada. A soma é limitada a **+0.80**. Com isso, goleiros
que fazem poucas defesas não recebem notas desproporcionais (correção da V1,
que dava +1.5 por defesa).

Tabela de referência (total de defesas → bônus):

| Defesas | Bônus |
| ------- | ----- |
| 1       | +0.05 |
| 3       | +0.15 |
| 5       | +0.29 |
| 6       | +0.36 |
| 8       | +0.52 |
| 10+     | +0.80 (teto) |

### 1.6 Gols sofridos — penalidade por posição (teto **-0.50**)

A penalidade considera os gols sofridos pelo time do atleta na partida
(placar do adversário). Aplicada por gol, com teto total de **-0.50**.

| Posição                         | Penalidade por gol sofrido |
| ------------------------------- | -------------------------- |
| Goleiro (GOLEIRO)               | -0.10                      |
| Zagueiro (ZAGUEIRO)             | -0.07                      |
| Lateral (LATERAL_DIREITO/ESQUERDO) | -0.05                   |
| Volante (VOLANTE)               | -0.03                      |
| Meia (MEIA_DE_LIGACAO/MEIA_ATACANTE) | -0.02               |
| Ponta (PONTA_DIREITA/ESQUERDA)  | -0.03                      |
| Atacante/2º Atacante            | -0.03                      |

### 1.7 Cartões

| Evento                                    | Penalidade |
| ----------------------------------------- | ---------- |
| Cartão amarelo (por cartão)               | -0.15      |
| Vermelho direto                           | -1.00      |
| 2º amarelo (vermelho + haver amarelo na partida) | -0.80 |

> Heurística: quando há evento `RED_CARD` **e também** ao menos um
> `YELLOW_CARD` do mesmo atleta na mesma partida, o vermelho é tratado como
> "2º amarelo" (-0.80). Caso contrário, vermelho direto (-1.00).

### 1.8 Gol contra

`OWN_GOAL`: **-0.80** por evento (não conta nos tetos de ataque).

---

## 2. Regra de retornos decrescentes e tetos (caps)

A V2 usa quatro mecanismos de contenção:

1. **Caps de componentes:** gols (+2.40), assistências (+1.50), defesas
   (+0.80), gols sofridos (-0.50). Nenhuma componente isolada pode inflar a
   nota.
2. **Retornos decrescentes (defesas):** cada faixa de defesas vale menos do
   que a anterior em termos de "custo-benefício" (0.05 → 0.07 → 0.08), o que
   equilibra goleiros com muitas e poucas ações.
3. **Pesos por posição:** zagueiros/volantes valorizam menos gols que
   atacantes, mas recebem o Índice Defensivo Coletivo — valorizando o papel
   de cada linha.
4. **Clamp final:** nota limitada ao intervalo `[3.0, 10.0]` com uma casa
   decimal.

---

## 3. Métrica G+A e estrutura de armazenamento

- `G+A = gols + assistências` é calculada no breakdown da nota **somente para
  exibição** — ela **não** é somada à nota como componente extra (gols e
  assistências já entram individualmente).
- Cada nota persistida em `match_player_stats` grava também os componentes
  individuais (colunas `goals`, `assists`, `yellow_cards`, `red_cards`,
  `saves`, `tackles`) e o JSON `rating_breakdown` com o detalhamento completo
  (base, resultado, bônus de gols/assistências/defesas/índice defensivo,
  gols sofridos, cartões, G+A). Isso permite recálculo automático **sem
  perdas** apenas relendo os eventos.

---

## 4. Recálculo das notas

### 4.1 Função canônica

`src/lib/rating-engine.ts` expõe:

```ts
recalculateMatchRatings(supabase, {
  matchId?: string,     // recalcula UMA partida
  championshipId: string, // recalcula toda a temporada
  seasonId?: string,
  roundNumber?: number, // filtra por rodada
  force?: boolean,      // padrão true: sobrescreve notas congeladas
  createdBy?: string | null,
})
```

- Reprocessa todos os eventos cadastrados (`match_events`) + rosters
  (`players`) direto do banco (hidratação) e persiste as notas em
  `match_player_stats` com a fórmula V2.
- Atualiza `players.average_rating` (trigger + RPC de consistência final).
- Grava log de auditoria em `rating_audit_logs` (uma entrada por partida).
- Com `force = false`, partidas já avaliadas são puladas.

### 4.2 Como acionar

**Pelo painel (recomendado):**

1. Em **Configurações do campeonato** (seção *Logs de Notas*) ou no topo de
   **Estatísticas**, clique em **Recalcular Notas** (visível apenas para
   ADMIN/criador).
2. Confirme a ação — o sistema recalcula **todas** as notas do campeonato com
   a fórmula V2 em lote, sobrescrevendo as congeladas.

**Via API:**

```
POST /api/admin/recalculate-historical-ratings
Content-Type: application/json

// Recalcular tudo (force):
{ "championshipId": "<uuid>", "force": true }

// Recalcular uma partida:
{ "championshipId": "<uuid>", "matchId": "<uuid>" }

// Recalcular uma rodada:
{ "championshipId": "<uuid>", "roundNumber": 2, "force": true }
```

Requer autenticação e perfil ADMIN/criador do campeonato.

---

## 5. Verificação pós-migração

- **Goleiro com poucas defesas:** escolha uma partida e recalcule. Um goleiro
  que antes recebia ~8-9 (V1) deve cair para a faixa **6.5 – 7.5** com a V2
  (base 6.5 + poucas defesas + possíveis penalidades).
- **Meia com 2 assistências:** com base 6.5 + vitória (+0.30) + 2 assistências
  (+0.75 cada = +1.50) o meia chega a aproximadamente **8.3**, pontuação alta
  consistente com um passe decisivo.
- Confira o JSON `rating_breakdown` em `match_player_stats` para validar cada
  componente.

---

## 6. Arquivos relacionados

| Arquivo                                            | Responsabilidade                          |
| -------------------------------------------------- | ----------------------------------------- |
| `src/lib/rating-engine.ts`                         | Motor V2, breakdown, recálculo            |
| `src/app/api/admin/recalculate-historical-ratings/route.ts` | API de recálculo em lote      |
| `src/components/tournament/rating/RecalculateRatingsButton.tsx` | Botão de recálculo (UI) |
| `supabase/migrations/00019_rating_system_v2_breakdown.sql` | Coluna `rating_breakdown` |