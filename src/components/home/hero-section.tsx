"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import Button from "@/components/ui/button";

export default function HeroSection() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);

  function handleCreateTournament() {
    if (authLoading) return;

    router.push(user ? "/dashboard/campeonatos" : "/register");
  }

  async function handleExploreClick() {
    if (authLoading) return;

    try {
      setLoading(true);

      if (user) {
        router.push("/dashboard/campeonatos");
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Erro ao navegar:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 pt-24 pb-20 text-center md:flex-row md:text-left">
      <div className="flex-1 space-y-6">
        <span className="inline-flex rounded-full border border-brand-accent/20 bg-brand-accent/10 px-4 py-1.5 text-sm font-medium tracking-wide text-brand-accent">
          PROJETO EM DESENVOLVIMENTO
        </span>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
          Gerencie seus campeonatos de forma{" "}
          <span className="text-brand-accent">simples</span> e profissional.
        </h1>

        <p className="max-w-2xl text-lg text-brand-textSecondary md:text-xl">
          Organize campeonatos, monte tabelas, acompanhe estatísticas,
          publique resultados em tempo real e ofereça uma experiência moderna
          para atletas e torcedores.
        </p>

        <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row md:justify-start">
          <Button
            variant="primary"
            onClick={handleCreateTournament}
            disabled={authLoading}
          >
            {authLoading ? "Verificando..." : "Criar Campeonato"}
          </Button>

          <button
            type="button"
            onClick={handleExploreClick}
            disabled={loading || authLoading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-transparent px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            )}
            Explorar Campeonatos
          </button>
        </div>
      </div>

      <div className="group relative w-full max-w-md flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-brand-card p-6 shadow-2xl transition-all duration-300 hover:border-brand-accent/40">
        <div className="absolute left-0 top-0 h-full w-1 bg-brand-accent" />

        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            Liga VKX de Futebol
          </h3>

          <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
            Rodada 3
          </span>
        </div>

        <div className="space-y-3">
          <MatchCard
            home="Time Alfa"
            score="3 x 1"
            away="Time Beta"
            highlight
          />

          <MatchCard
            home="Santos FC"
            score="0 x 0"
            away="Flamengo"
          />
        </div>
      </div>
    </section>
  );
}

interface MatchCardProps {
  home: string;
  away: string;
  score: string;
  highlight?: boolean;
}

function MatchCard({
  home,
  away,
  score,
  highlight = false,
}: MatchCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-brand-dark p-3 transition-colors hover:border-slate-700">
      <span className="font-semibold text-white">{home}</span>

      <span
        className={`rounded-md px-3 py-1 font-bold ${
          highlight
            ? "bg-brand-card text-brand-accent"
            : "bg-brand-card text-brand-textSecondary"
        }`}
      >
        {score}
      </span>

      <span className="font-semibold text-white">{away}</span>
    </div>
  );
}