"use client";

import { useState } from "react";
import {
  Search,
  Trophy,
  MapPin,
  ArrowRight,
  ServerCrash,
} from "lucide-react";

import Button from "@/components/ui/button";

interface ChampionshipsSectionData {
  id: string;
  name: string;
  location: string;
  teamsCount: number;
  status: "INSCRICOES_ABERTAS" | "EM_ANDAMENTO" | "FINALIZADO";
}

export default function ChampionshipsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<ChampionshipsSectionData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      setResults([]);
    } catch (error) {
      console.error("Erro ao buscar campeonatos:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section
      id="campeonatos"
      className="relative mx-auto max-w-7xl overflow-hidden border-t border-slate-800/60 px-6 py-24"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-12">
        <div className="space-y-6 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center shadow-2xl md:p-12">
          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-brand-accent/20 bg-brand-accent/10">
              <Trophy className="h-6 w-6 text-brand-accent" />
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Encontre seu{" "}
              <span className="text-brand-accent">Campeonato</span>
            </h2>

            <p className="mx-auto max-w-xl text-sm text-slate-400 md:text-base">
              Pesquise diretamente na nossa base oficial de ligas e torneios.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="mx-auto flex max-w-2xl flex-col gap-3 pt-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Pesquise por nome, modalidade ou cidade..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-4 pl-11 pr-5 text-sm text-white transition-colors placeholder:text-slate-600 focus:border-brand-accent/60 focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="h-[50px] whitespace-nowrap font-bold sm:h-auto"
            >
              {isLoading ? "Buscando..." : "Buscar Torneio"}
            </Button>
          </form>
        </div>

        {hasSearched && (
          <div className="animate-fade-in space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
              Resultados da pesquisa
            </h3>

            {isLoading ? (
              <LoadingState />
            ) : results.length ? (
              <ResultsList results={results} />
            ) : (
              <EmptyState search={searchQuery} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 py-12 text-center text-sm text-slate-500">
      Consultando servidores VKX Sports...
    </div>
  );
}

function ResultsList({ results }: { results: ChampionshipsSectionData[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {results.map((championship) => (
        <div
          key={championship.id}
          className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-300 hover:border-brand-accent/40"
        >
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white transition-colors group-hover:text-brand-accent">
              {championship.name}
            </h4>

            <p className="flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {championship.location}
            </p>
          </div>

          <span className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-accent">
            Ver painel completo
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 py-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-slate-500">
        <ServerCrash className="h-5 w-5" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-bold text-white">
          Nenhum campeonato encontrado
        </p>

        <p className="mx-auto max-w-md text-xs leading-relaxed text-slate-500">
          Não encontramos nenhuma competição ativa ou finalizada com o termo{" "}
          <span className="font-semibold text-brand-accent">
            &ldquo;{search}&rdquo;
          </span>{" "}
          na nossa base de dados.
        </p>
      </div>
    </div>
  );
}