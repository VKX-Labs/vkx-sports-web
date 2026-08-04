"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getPublicChampionship } from "@/services/championships/public";
import type { Championship } from "@/types/championship";

interface PublicChampionshipContextValue {
  championship: Championship | null;
  seasonId: string | null;
  loading: boolean;
  notFound: boolean;
  refresh: () => Promise<void>;
}

const PublicChampionshipContext = createContext<PublicChampionshipContextValue | null>(
  null
);

export function PublicChampionshipProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [seasonId, setSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setNotFound(false);

    try {
      const data = await getPublicChampionship(slug);

      if (!data) {
        setNotFound(true);
        setChampionship(null);
        setSeasonId(null);
        return;
      }

      setChampionship(data.championship);
      setSeasonId(data.seasonId);
    } catch (err) {
      console.error("Erro ao carregar campeonato público:", err);
      setNotFound(true);
      setChampionship(null);
      setSeasonId(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PublicChampionshipContext.Provider
      value={{ championship, seasonId, loading, notFound, refresh }}
    >
      {children}
    </PublicChampionshipContext.Provider>
  );
}

export function usePublicChampionshipContext() {
  const ctx = useContext(PublicChampionshipContext);
  if (!ctx) {
    throw new Error(
      "usePublicChampionshipContext deve ser usado dentro de PublicChampionshipProvider."
    );
  }
  return ctx;
}
