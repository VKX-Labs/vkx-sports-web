"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Upload, Loader2, User, Trophy, Shield, Star } from "lucide-react";
import { PlayerService } from "@/services/players/player.service";
import type { Player, UpdatePlayerInput, PlayerStats } from "@/types/player";
import type { Team } from "@/types/team";

interface EditPlayerModalProps {
  player: Player | null;
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPlayerModal({
  player,
  teams,
  isOpen,
  onClose,
  onSuccess,
}: EditPlayerModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [stats, setStats] = useState<PlayerStats>({
    matches: 0,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 0,
    rating: 0.0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async (playerId: string) => {
    try {
      setLoadingStats(true);
      const data = await PlayerService.getPlayerStats(playerId);
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      setStats({
        matches: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        saves: 0,
        rating: 0.0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (player && isOpen) {
      setName(player.name || "");
      setTeamId(player.team_id || "");
      setImagePreview(player.photo_url || null);
      setImageFile(null);

      fetchStats(player.id);
    }
  }, [player, isOpen]);

  if (!isOpen || !player) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Selecione uma imagem PNG, JPG ou WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("O nome do jogador é obrigatório.");
      return;
    }

    try {
      setLoading(true);

      let photoUrl = player.photo_url;
      if (imageFile) {
        photoUrl = await PlayerService.uploadPhoto(imageFile);
      }

      const updateData: UpdatePlayerInput = {
        name: name.trim(),
        team_id: teamId !== "" ? teamId : null,
        photo_url: photoUrl,
      };

      await PlayerService.editPlayer(player.id, updateData);

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar dados do jogador.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark border border-slate-850 rounded-2xl w-full max-w-md mx-auto max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-none">
        <div className="p-4 sm:p-5 border-b border-slate-800/60 flex items-center justify-between sticky top-0 bg-brand-dark z-10">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-accent" />
            <h2 className="text-base font-bold text-brand-textPrimary">Editar Jogador</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-slate-800/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 flex-1">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
            <div
              onClick={() => !loading && fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 hover:border-brand-accent flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview do Atleta" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-brand-textSecondary group-hover:text-brand-accent transition">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-semibold">FOTO</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleImageChange}
              className="hidden"
              disabled={loading}
            />
            <span className="text-[11px] text-brand-textSecondary mt-2">Clique para alterar a foto</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-brand-accent" />
                Estatísticas Temporada
              </label>
              {loadingStats && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-accent" />}
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
              <div className="bg-slate-950/60 p-2 rounded-lg text-center border border-slate-850">
                <span className="block text-[10px] font-medium text-slate-400">Nota Média</span>
                <span className="text-sm font-black text-amber-300 flex items-center justify-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 stroke-amber-300 inline" />
                  {(stats.rating || 0).toFixed(1)}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg text-center border border-slate-850">
                <span className="block text-[10px] font-medium text-slate-400">Jogos</span>
                <span className="text-sm font-black text-white">{stats.matches}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg text-center border border-slate-850">
                <span className="block text-[10px] font-medium text-slate-400">Gols</span>
                <span className="text-sm font-black text-emerald-400">{stats.goals}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg text-center border border-slate-850">
                <span className="block text-[10px] font-medium text-slate-400">Assist.</span>
                <span className="text-sm font-black text-blue-400">{stats.assists}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg text-center border border-slate-850">
                <span className="block text-[10px] font-medium text-slate-400">Defesas</span>
                <span className="text-sm font-black text-cyan-400 flex items-center justify-center gap-0.5">
                  <Shield className="w-3 h-3 inline" />
                  {stats.saves}
                </span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg text-center border border-slate-850">
                <span className="block text-[10px] font-medium text-slate-400">Cartões</span>
                <span className="text-sm font-black text-slate-300">
                  <span className="text-amber-400">{stats.yellow_cards}</span> / <span className="text-rose-500">{stats.red_cards}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              placeholder="Ex: Lamine Yamal"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 md:py-2.5 py-3 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-accent transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">
              Equipe
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 md:py-2.5 py-3 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-accent transition"
            >
              <option value="">Sem equipe (Agente Livre)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 md:py-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-brand-textSecondary hover:text-brand-textPrimary transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 md:py-2 py-2.5 rounded-xl text-xs font-bold bg-brand-accent hover:bg-brand-accentHover text-slate-950 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}