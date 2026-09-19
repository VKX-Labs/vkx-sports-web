"use client";

import React, { useEffect, useRef, useState } from "react";
import { Settings, Gavel, Star, Flag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TeamStanding } from "@/types/tournament";
import { PointsDeductionModal } from "@/components/tournament/PointsDeductionModal";
import {
  RatingActionsModal,
  type RatingActionMode,
} from "@/components/tournament/rating/RatingActionsModal";

interface AdminToolDefinition {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  renderModal: (props: {
    championshipId: string;
    standings: TeamStanding[];
    onSaved: () => void;
    onClose: () => void;
  }) => React.ReactNode;
}

interface StandingsAdminMenuProps {
  championshipId: string;
  standings: TeamStanding[];
  onSaved: () => void;
  canManageRatings?: boolean;
}

function makeRatingTool(
  key: string,
  label: string,
  description: string,
  icon: LucideIcon,
  mode: RatingActionMode
): AdminToolDefinition {
  return {
    key,
    label,
    description,
    icon,
    renderModal: ({ championshipId: cid, onSaved: saved, onClose }) => (
      <RatingActionsModal
        isOpen
        onClose={onClose}
        championshipId={cid}
        mode={mode}
        onSaved={saved}
      />
    ),
  };
}

export function StandingsAdminMenu({
  championshipId,
  standings,
  onSaved,
  canManageRatings = false,
}: StandingsAdminMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<AdminToolDefinition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tools: AdminToolDefinition[] = [
    {
      key: "points-deduction",
      label: "Dedução de Pontos",
      description: "Punição STJD",
      icon: Gavel,
      renderModal: ({ championshipId: cid, standings: st, onSaved: saved, onClose }) => (
        <PointsDeductionModal
          isOpen
          onClose={onClose}
          championshipId={cid}
          standings={st}
          onSaved={saved}
        />
      ),
    },
    ...(canManageRatings
      ? [
          makeRatingTool(
            "rating-round",
            "Calcular Nota Média da Rodada",
            "Notas pendentes da rodada",
            Star,
            "ROUND"
          ),
          makeRatingTool(
            "rating-match",
            "Calcular Nota por Partida",
            "Recalculo explícito de um jogo",
            Star,
            "MATCH"
          ),
          makeRatingTool(
            "rating-finalize",
            "Finalizar Rodada Atual",
            "Avançar rodada ativa (não recalcula notas)",
            Flag,
            "FINALIZE"
          ),
        ]
      : []),
  ];

  useEffect(() => {
    if (!menuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Ferramentas administrativas"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer"
      >
        <Settings className="w-4 h-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-10 z-30 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Ferramentas de Administração
            </span>
          </div>
          <div className="p-1" role="menu" aria-label="Ferramentas administrativas">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.key}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveTool(tool);
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-zinc-800/60 rounded-lg transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-zinc-200">
                      {tool.label}
                    </span>
                    <span className="block text-[11px] text-zinc-500">
                      {tool.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTool &&
        activeTool.renderModal({
          championshipId,
          standings,
          onSaved,
          onClose: () => setActiveTool(null),
        })}
    </div>
  );
}