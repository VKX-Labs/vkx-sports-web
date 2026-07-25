import React, { useState } from "react";
import { Award, Plus, Trash2 } from "lucide-react";
import { EventType } from "@/types";
import { MatchEventItem, SimplePlayer } from "@/services/matchService";

interface MatchEventsSectionProps {
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  homePlayers: SimplePlayer[];
  awayPlayers: SimplePlayer[];
  events: MatchEventItem[];
  onAddEvent: (event: MatchEventItem) => void;
  onRemoveEvent: (id: string) => void;
}

export function MatchEventsSection({
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  events,
  onAddEvent,
  onRemoveEvent,
}: MatchEventsSectionProps) {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");
  const [eventType, setEventType] = useState<EventType>("GOAL");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  const currentTeamPlayers = selectedTeam === "home" ? homePlayers : awayPlayers;
  const currentTeamId = selectedTeam === "home" ? homeTeam.id : awayTeam.id;

  const handleAdd = () => {
    onAddEvent({
      id: Math.random().toString(),
      team_id: currentTeamId,
      player_id: selectedPlayer || null,
      event_type: eventType,
    });
    setSelectedPlayer("");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" /> Detalhar Eventos (Opcional)
        </h3>
        <span className="text-xs text-slate-500">
          Associe os gols/assistências aos jogadores se souber quem fez.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value as "home" | "away")}
          className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
        >
          <option value="home">{homeTeam.name}</option>
          <option value="away">{awayTeam.name}</option>
        </select>

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
          className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
        >
          <option value="GOAL">⚽ Gol</option>
          <option value="ASSIST">🎯 Assistência</option>
          <option value="SAVE">🧤 Defesa de Goleiro</option>
          <option value="YELLOW_CARD">🟨 Cartão Amarelo</option>
          <option value="RED_CARD">🟥 Cartão Vermelho</option>
        </select>

        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-emerald-500"
        >
          <option value="">-- Jogador (Opcional) --</option>
          {currentTeamPlayers.length === 0 ? (
            <option disabled value="">Nenhum jogador cadastrado</option>
          ) : (
            currentTeamPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))
          )}
        </select>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg p-2.5 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      <div className="space-y-2 mt-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase">Eventos Salvos no Jogo:</h4>
        {events.length === 0 ? (
          <p className="text-xs text-slate-600 italic">Nenhum evento individual vinculado ainda.</p>
        ) : (
          events.map((ev, idx) => {
            const allPlayers = [...homePlayers, ...awayPlayers];
            const playerObj = allPlayers.find((p) => p.id === ev.player_id);
            const teamName = ev.team_id === homeTeam.id ? homeTeam.name : awayTeam.name;

            return (
              <div
                key={ev.id || idx}
                className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800 text-sm text-slate-200"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                    {ev.event_type}
                  </span>
                  <span>{teamName}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">
                    {playerObj ? playerObj.name : "Sem Jogador Especificado"}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveEvent(ev.id!)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}