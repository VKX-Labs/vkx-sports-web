import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  CircleDot, 
  RectangleVertical, 
  ArrowRightLeft, 
  Handshake, 
  Activity,
  ShieldAlert,
  Zap 
} from "lucide-react";
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
  readOnly?: boolean;
}

export function MatchEventsSection({
  homeTeam,
  awayTeam,
  homePlayers,
  awayPlayers,
  events,
  onAddEvent,
  onRemoveEvent,
  readOnly = false,
}: MatchEventsSectionProps) {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");
  const [eventType, setEventType] = useState<EventType>("GOAL");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [assistPlayer, setAssistPlayer] = useState<string>("");

  const currentTeamPlayers = selectedTeam === "home" ? homePlayers : awayPlayers;
  const currentTeamId = selectedTeam === "home" ? homeTeam.id : awayTeam.id;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newEvent: MatchEventItem = {
      id: Math.random().toString(),
      team_id: currentTeamId,
      player_id: selectedPlayer || null,
      assist_player_id: eventType === "GOAL" ? (assistPlayer || null) : null,
      type: eventType,
    };

    onAddEvent(newEvent);

    setSelectedPlayer("");
    setAssistPlayer("");
  };

  const renderEventIcon = (type: string) => {
    switch (type) {
      case "GOAL":
        return <CircleDot className="w-3.5 h-3.5 text-emerald-400" />;
      case "ASSIST":
        return <Handshake className="w-3.5 h-3.5 text-sky-400" />;
      case "YELLOW_CARD":
        return <RectangleVertical className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />;
      case "RED_CARD":
        return <RectangleVertical className="w-3.5 h-3.5 text-red-500 fill-red-500/30" />;
      case "SAVE":
        return <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />;
      case "TACKLE":
        return <Zap className="w-3.5 h-3.5 text-orange-400" />;
      case "SUBSTITUTION":
        return <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "GOAL": return "Gol";
      case "ASSIST": return "Assistência";
      case "YELLOW_CARD": return "Cartão Amarelo";
      case "RED_CARD": return "Cartão Vermelho";
      case "SAVE": return "Defesa de Goleiro";
      case "TACKLE": return "Desarme";
      case "SUBSTITUTION": return "Substituição";
      default: return type;
    }
  };

  const allPlayers = [...homePlayers, ...awayPlayers];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
      
      {!readOnly && (
      <div className="md:col-span-5 bg-zinc-900/80 rounded-xl border border-zinc-800 p-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wide">
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          Lançar Novo Evento
        </h3>

        <form onSubmit={handleAdd} className="space-y-2.5">
          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Equipe</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value as "home" | "away")}
              className="w-full md:h-9 h-11 px-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            >
              <option value="home">{homeTeam.name}</option>
              <option value="away">{awayTeam.name}</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">Tipo de Evento</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full md:h-9 h-11 px-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            >
              <option value="GOAL">Gol</option>
              <option value="YELLOW_CARD">Cartão Amarelo 🟨</option>
              <option value="RED_CARD">Cartão Vermelho 🟥</option>
              <option value="SAVE">Defesa de Goleiro 🧤</option>
              <option value="TACKLE">Desarme ⚡</option>
              <option value="ASSIST">Assistência (Avulsa)</option>
              <option value="SUBSTITUTION">Substituição 🔄</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-zinc-400 mb-1 block">
              {eventType === "SAVE" ? "Goleiro / Defensor" : eventType === "GOAL" ? "Autor do Gol" : "Atleta Principal"}
            </label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full md:h-9 h-11 px-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
            >
              <option value="">Selecione o atleta (opcional)</option>
              {currentTeamPlayers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {eventType === "GOAL" && (
            <div>
              <label className="text-[10px] font-medium text-sky-400/90 mb-1 block">
                Assistência / Passe (Opcional)
              </label>
              <select
                value={assistPlayer}
                onChange={(e) => setAssistPlayer(e.target.value)}
                className="w-full md:h-9 h-11 px-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 outline-none focus:border-sky-500/50"
              >
                <option value="">Sem assistência</option>
                {currentTeamPlayers
                  .filter((p) => p.id !== selectedPlayer)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full md:h-9 h-11 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 pt-0.5"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Evento
          </button>
        </form>
      </div>
      )}

      <div className={`${readOnly ? "md:col-span-12" : "md:col-span-7"} bg-zinc-900/80 rounded-xl border border-zinc-800 p-4 space-y-4`}>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">Timeline da Partida</h3>
          <span className="text-[11px] font-mono text-zinc-500">{events.length} evento(s)</span>
        </div>

        {events.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-zinc-500">Nenhum evento registrado.</p>
          </div>
        ) : (
          <div className="relative space-y-2.5 py-1 md:before:absolute md:before:inset-0 md:before:left-1/2 md:before:-ml-px md:before:w-0.5 md:before:bg-zinc-800">
            {events.map((ev, idx) => {
              const isHome = ev.team_id === homeTeam.id;
              const player = allPlayers.find((p) => p.id === ev.player_id);
              const assistPlayerObj = allPlayers.find((p) => p.id === ev.assist_player_id);

              return (
                <div
                  key={ev.id || idx}
                  className={`relative flex items-center justify-between gap-2 ${
                    isHome ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className={`w-full md:w-[44%] bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg flex items-center justify-between gap-2 ${
                    isHome ? "md:text-right" : "md:text-left"
                  }`}>
                    <div className="truncate w-full">
                      <div className="text-xs font-bold text-zinc-100 truncate">
                        {player ? player.name : "Atleta não informado"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        <span>{getEventLabel(ev.type)}</span>
                        {ev.assist_player_id && assistPlayerObj && (
                          <span className="text-sky-400">(Passe: {assistPlayerObj.name})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 hidden md:flex w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 items-center justify-center shrink-0">
                    {renderEventIcon(ev.type)}
                  </div>

                  <div className={`flex items-center ${isHome ? "md:justify-start" : "md:justify-end"}`}>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => onRemoveEvent(ev.id!)}
                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-red-500/10"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}