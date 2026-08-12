import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createServerClient } from "@supabase/ssr";

function isMissingTableError(err: any): boolean {
  const message = `${err?.message || ""} ${err?.error_description || ""}`.toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("relation") || message.includes("not found")
  );
}

const DEFAULT_BADGE = "https://via.placeholder.com/40?text=FC";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "A chave GROQ_API_KEY não está configurada no arquivo .env.local." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });
    const body = await req.json();
    const { championshipId, championshipName, roundNumber, roundName, matches } =
      body;

    if (!championshipId || !roundNumber || !roundName) {
      return NextResponse.json(
        {
          error:
            "championshipId, roundNumber e roundName são obrigatórios para salvar o resumo.",
        },
        { status: 400 }
      );
    }

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma partida encontrada nesta rodada para analisar." },
        { status: 400 }
      );
    }

    // Linhas EXATAS de confronto (escudos já resolvidos) que a IA deve
    // reproduzir sem alterar nenhuma URL. Cada time tem seu próprio escudo.
    const confrontosFormatted = matches
      .map((m: any, idx: number) => {
        const homeTeam =
          m.home_team?.name || m.home_team_name || `Mandante ${idx + 1}`;
        const awayTeam =
          m.away_team?.name || m.away_team_name || `Visitante ${idx + 1}`;
        const homeLogo =
          m.home_team?.badge_url || m.home_badge_url || DEFAULT_BADGE;
        const awayLogo =
          m.away_team?.badge_url || m.away_badge_url || DEFAULT_BADGE;
        const homeScore = m.home_score ?? 0;
        const awayScore = m.away_score ?? 0;

        return `- ![${homeTeam}](${homeLogo}) ${homeScore} x ${awayScore} ![${awayTeam}](${awayLogo})`;
      })
      .join("\n");

    // Detalhes dos eventos por partida (apenas para a narrativa jornalística)
    const detalhesFormatted = matches
      .map((m: any, idx: number) => {
        const homeTeam =
          m.home_team?.name || m.home_team_name || `Mandante ${idx + 1}`;
        const awayTeam =
          m.away_team?.name || m.away_team_name || `Visitante ${idx + 1}`;
        const homeLogo =
          m.home_team?.badge_url || m.home_badge_url || DEFAULT_BADGE;
        const awayLogo =
          m.away_team?.badge_url || m.away_badge_url || DEFAULT_BADGE;

        const events = m.events || [];

        const goals = events
          .filter((e: any) => e.type === "GOAL" || e.type === "GOL")
          .map((e: any) => `${e.player_name || e.player?.name || "Jogador"} (${e.team_name || e.team?.name || homeTeam})`)
          .join(", ");

        const assists = events
          .filter((e: any) => e.type === "ASSIST" || e.type === "ASSISTENCIA")
          .map((e: any) => `${e.player_name || e.player?.name || "Jogador"} (${e.team_name || e.team?.name || homeTeam})`)
          .join(", ");

        const yellowCards = events
          .filter((e: any) => e.type === "YELLOW_CARD" || e.type === "AMARELO")
          .map((e: any) => `${e.player_name || e.player?.name || "Jogador"} (${e.team_name || e.team?.name || homeTeam})`)
          .join(", ");

        const redCards = events
          .filter((e: any) => e.type === "RED_CARD" || e.type === "VERMELHO")
          .map((e: any) => `${e.player_name || e.player?.name || "Jogador"} (${e.team_name || e.team?.name || homeTeam})`)
          .join(", ");

        const saves = events
          .filter((e: any) => e.type === "SAVE" || e.type === "DEFESA")
          .map((e: any) => `${e.player_name || e.player?.name || "Goleiro"} (${e.team_name || e.team?.name || homeTeam})`)
          .join(", ");

        return `
📌 Jogo ${idx + 1}: ${homeTeam} x ${awayTeam}
- Escudo Mandante (URL): ${homeLogo}
- Escudo Visitante (URL): ${awayLogo}
- Gols marcados: ${goals || "Nenhum gol"}
- Assistências: ${assists || "Nenhuma"}
- Cartões Amarelos: ${yellowCards || "Nenhum"}
- Cartões Vermelhos: ${redCards || "Nenhum"}
- Defesas de destaque (Goleiros): ${saves || "Nenhuma registrada"}
`;
      })
      .join("\n---\n");

    const prompt = `
Você é um jornalista esportivo cobrindo o campeonato "${championshipName}".
Sua tarefa é escrever um boletim/notícia focado EXCLUSIVAMENTE nos acontecimentos da **${roundName}**.

REGRA CRÍTICA PARA OS ESCUDOS: Na seção CONFRONTOS DA RODADA, você deve usar EXATAMENTE a linha formatada com as URLs das imagens fornecidas no input. Não repita o escudo do time mandante no time visitante. Cada time possui sua própria imagem correspondente.

DADOS REAIS E OFICIAIS DAS PARTIDAS DA RODADA:

CONFRONTOS DA RODADA (use EXATAMENTE estas linhas, sem alterar nenhuma URL de escudo):
${confrontosFormatted}

DETALHES DOS EVENTOS (apenas para redigir a narrativa — NÃO use escudos no texto corrido):
${detalhesFormatted}

REGRAS OBRIGATÓRIAS DE RENDERIZAÇÃO:
1. Escreva uma matéria empolgante em Markdown.
2. Na seção "Resumo dos Confrontos", copie LITERALMENTE o bloco CONFRONTOS DA RODADA acima, na mesma ordem e com as mesmas URLs de escudo, sem trocar ou repetir imagens entre os times. Mantenha as linhas agrupadas em um único bloco (sem parágrafos entre elas), logo após o título da seção e antes de qualquer texto narrativo.
3. No texto jornalístico, mencione os times usando APENAS **negrito** (ex: **Time A**), sem repetir os escudos.
4. Cada jogador pertence estritamente ao seu time indicado nos dados acima.
5. Para a seção de goleiros/paredão, utilize OBRIGATORIAMENTE um bloco de citação Markdown (começando com >) para dar um grande destaque às defesas.

ESTRUTURA DA MATÉRIA:
# 📰 Boletim Oficial: ${roundName} - ${championshipName}

### ⚡ Resumo dos Confrontos
**CONFRONTOS DA RODADA:**
${confrontosFormatted}

(Em seguida, escreva a narrativa jornalística descrevendo os jogos, placares e autores dos gols e assistências — mencionando os times apenas em negrito, sem escudos).

### 🟨 Disciplina
(Relate os cartões amarelos e vermelhos distribuídos na rodada).

### 🧤 Paredão da Rodada
> 🧱 **DESTAQUE SOBRE A LINHA:** (Mencione em tom dramático e empolgante as defesas efetuadas pelos goleiros registrados na rodada).

### ⭐ Craque da Rodada
(Escolha o principal jogador com base no desempenho da rodada).
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Você é um jornalista esportivo especialista em futebol e análises táticas. REGRA CRÍTICA PARA OS ESCUDOS: Na seção CONFRONTOS DA RODADA, você deve usar EXATAMENTE a linha formatada com as URLs das imagens fornecidas no input. Não repita o escudo do time mandante no time visitante. Cada time possui sua própria imagem correspondente." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const summary = response.choices[0]?.message?.content || "";

    await persistSummary({
      championshipId,
      roundNumber,
      roundName,
      content: summary,
      cookies: req.cookies.getAll(),
    });

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Erro na API da Groq:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno ao processar resumo com Groq." },
      { status: 500 }
    );
  }
}

interface PersistSummaryParams {
  championshipId: string;
  roundNumber: number;
  roundName: string;
  content: string;
  cookies: { name: string; value: string }[];
}

async function persistSummary({
  championshipId,
  roundNumber,
  roundName,
  content,
  cookies,
}: PersistSummaryParams): Promise<void> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookies;
          },
          setAll() {},
        },
      }
    );

    const { error } = await supabase.from("round_summaries").upsert(
      {
        championship_id: championshipId,
        round_number: roundNumber,
        round_name: roundName,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "championship_id,round_number" }
    );

    if (error) {
      if (!isMissingTableError(error)) {
        console.error("Erro ao salvar o resumo no Supabase:", error);
      }
    }
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.error("Erro ao persistir o resumo no Supabase:", err);
    }
  }
}