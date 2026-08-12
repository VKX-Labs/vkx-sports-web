"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, User, Upload, Loader2 } from "lucide-react";
import * as z from "zod";
import { playerSchema } from "@/validators/player.schema";
import { PlayerService } from "@/services/players/player.service";
import { getTeams } from "@/services/teams/team-service";
import { PLAYER_POSITIONS, POSITION_LABELS } from "@/types/player";
import type { Team } from "@/types/team";

type PlayerFormValues = z.input<typeof playerSchema>;

interface PlayerFormProps {
  championshipId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlayerForm({ championshipId, isOpen, onClose, onSuccess }: PlayerFormProps) {
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      team_id: undefined,
      position: null,
      number: null,
    }
  });

  useEffect(() => {
    if (isOpen && championshipId) {
      getTeams(championshipId)
        .then((data) => setTeams(data || []))
        .catch(() => setTeams([]));
    }
  }, [isOpen, championshipId]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A foto deve ter no máximo 2MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmitForm = async (data: PlayerFormValues) => {
    try {
      setLoading(true);
      let photoUrl = null;

      if (imageFile) {
        photoUrl = await PlayerService.uploadPhoto(imageFile);
      }

      await PlayerService.registerPlayer(championshipId, {
        name: data.name,
        team_id: data.team_id || null,
        position: data.position || null,
        number: data.number ?? null,
        photo_url: photoUrl,
      });

      reset();
      setImageFile(null);
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao cadastrar jogador.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark border border-slate-850 rounded-2xl w-full max-w-md mx-auto shadow-2xl flex flex-col">

        <div className="p-4 sm:p-5 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-accent" />
            <h2 className="text-base font-bold text-brand-textPrimary">Novo Jogador</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-slate-800/50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-4 sm:p-6 space-y-5">

          <div className="flex flex-col items-center justify-center space-y-2">
            <div
              onClick={() => !loading && fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 hover:border-brand-accent/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-brand-textSecondary group-hover:text-brand-accent transition">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-semibold">FOTO</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" disabled={loading} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Pedro Henrique"
              disabled={loading}
              {...register("name")}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-brand-textPrimary placeholder-slate-600 focus:outline-none focus:border-brand-accent"
            />
            {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Equipe (Opcional)</label>
            <select
              disabled={loading}
              {...register("team_id")}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-accent appearance-none"
            >
              <option value="">Sem equipe</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Posição</label>
            <select
              disabled={loading}
              {...register("position", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-accent appearance-none"
            >
              <option value="">Selecione a posição</option>
              {PLAYER_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {POSITION_LABELS[position]}
                </option>
              ))}
            </select>
            {errors.position && <p className="text-[10px] text-red-500 mt-1">{errors.position.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Número da Camisa (Opcional)</label>
            <input
              type="number"
              min={1}
              max={99}
              placeholder="Ex: 10"
              disabled={loading}
              {...register("number", {
                setValueAs: (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
              })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-brand-textPrimary placeholder-slate-600 focus:outline-none focus:border-brand-accent"
            />
            {errors.number && <p className="text-[10px] text-red-500 mt-1">{errors.number.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-brand-textSecondary hover:text-brand-textPrimary transition disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-accent hover:bg-brand-accentHover text-slate-950 flex items-center gap-1.5 transition disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Atleta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
