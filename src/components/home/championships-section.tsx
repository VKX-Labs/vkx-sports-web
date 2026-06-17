"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button";

// Contrato da estrutura de um campeonato vindo da base de dados
interface Championship {
  id: string;
  name: string;
  location: string;
  teamsCount: number;
  status: "INSCRICOES_ABERTAS" | "EM_ANDAMENTO" | "FINALIZADO";
}

export default function ChampionshipsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Championship[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Função que fará a chamada real para a base de dados no futuro
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      // TODO: Integrar com o serviço da API (ex: services/championship.service.ts)
      // const data = await searchChampionshipsFromDB(searchQuery);
      // setResults(data);
      
      // Por enquanto, simulando um retorno vazio do banco de dados real
      setResults([]);
    } catch (error) {
      console.error("Erro ao buscar campeonatos na base de dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="campeonatos" className="max-w-7xl mx-auto px-6 py-24 relative overflow-hidden border-t border-slate-800/60">
      
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 space-y-12 max-w-4xl mx-auto">
        
        {/* BLOCO DE BUSCA NO SISTEMA */}
        <div className="bg-gradient-to-r from-slate-900 to-brand-card p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="space-y-3">
            <span className="text-3xl">🏆</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Encontre seu <span className="text-brand-accent">Campeonato</span>
            </h2>
            <p className="text-brand-textSecondary text-sm md:text-base max-w-xl mx-auto">
              Digite o termo desejado para pesquisar diretamente na nossa base de dados oficial de ligas e torneios.
            </p>
          </div>

          {/* FORMULÁRIO DE PESQUISA */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto pt-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquise por nome, modalidade ou cidade..."
                className="w-full bg-brand-dark border border-slate-750 rounded-xl px-5 py-4 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-brand-accent transition-colors duration-200"
              />
            </div>
            <Button type="submit" variant="primary" className="whitespace-nowrap font-bold" disabled={isLoading}>
              {isLoading ? "Buscando..." : "Buscar Torneio"}
            </Button>
          </form>
        </div>

        {/* CONTAINER DE RESULTADOS DA BASE DE DADOS */}
        {hasSearched && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-white tracking-tight">
              Resultados da pesquisa
            </h3>

            {isLoading ? (
              <div className="text-center py-12 text-brand-textSecondary border border-dashed border-slate-800 rounded-2xl">
                <p className="text-sm">Consultando servidores VKX Sports...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((tournament) => (
                  <div key={tournament.id} className="bg-brand-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-white">{tournament.name}</h4>
                      <p className="text-sm text-brand-textSecondary">📍 {tournament.location}</p>
                    </div>
                    <span className="text-xs text-brand-accent mt-4 block">Ver painel completo →</span>
                  </div>
                ))}
              </div>
            ) : (
              /* ESTADO REAL CASO NÃO ENCONTRE NADA NA CONSULTA */
              <div className="text-center py-12 bg-brand-card/50 border border-slate-800 rounded-2xl space-y-2">
                <p className="text-white font-semibold">Nenhum campeonato encontrado</p>
                <p className="text-xs text-brand-textSecondary max-w-md mx-auto px-4">
                  Não encontramos nenhuma competição ativa ou finalizada com o termo <span className="text-brand-accent">"{searchQuery}"</span> na nossa base de dados atual.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}