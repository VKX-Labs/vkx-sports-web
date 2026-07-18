"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Shield, Upload, Loader2 } from "lucide-react";
import { createTeam } from "@/services/teams/team-service";
import { uploadTeamLogo } from "@/lib/storage/upload-team-logo";
import { createTeamSchema, type CreateTeamFormData } from "@/validators";

interface TeamFormProps {
  championshipId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeamForm({ championshipId, isOpen, onClose, onSuccess }: TeamFormProps) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
  });

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Selecione um formato de imagem válido (PNG, JPG ou WEBP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const cleanExtension = file.name.split(".").pop();
    const sanitizedFile = new File([file], `${cleanName}_${Date.now()}.${cleanExtension}`, { type: file.type });

    setImageFile(sanitizedFile);
    setImagePreview(URL.createObjectURL(sanitizedFile));
  };

  const onSubmitForm = async (data: CreateTeamFormData) => {
    try {
      setLoading(true);

      let badgeUrl: string | null = null;
      if (imageFile) {
        badgeUrl = await uploadTeamLogo(imageFile);
      }

      await createTeam(championshipId, {
        name: data.name,
        short_name: data.short_name || null,
        city: data.city || null,
        manager: data.manager || null,
        badge_url: badgeUrl,
      });

      reset();
      setImageFile(null);
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao salvar a equipe.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark border border-slate-850 rounded-2xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-none">
        
        <div className="p-4 sm:p-5 border-b border-slate-800/60 flex items-center justify-between sticky top-0 bg-brand-dark z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-accent" />
            <h2 className="text-base font-bold text-brand-textPrimary">Nova Equipe</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-slate-800/50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-4 sm:p-6 space-y-5 flex-1">
          
          <div className="flex flex-col sm:flex-row gap-5 items-center bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
            <div className="flex flex-col items-center">
              <div 
                onClick={() => !loading && fileInputRef.current?.click()} 
                className="w-20 h-20 rounded-full bg-slate-900 border-2 border-dashed border-slate-700 hover:border-brand-accent/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-brand-textSecondary group-hover:text-brand-accent transition">
                    <Upload className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-semibold">ESCUDO</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleImageChange} className="hidden" disabled={loading} />
            </div>

            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Nome da Equipe *</label>
                <input 
                  type="text" 
                  placeholder="Ex: Real Madrid"
                  disabled={loading}
                  {...register("name")}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary placeholder-slate-600 focus:outline-none focus:border-brand-accent"
                />
                {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Sigla</label>
                <input 
                  type="text" 
                  maxLength={5} 
                  placeholder="Ex: RMA"
                  disabled={loading}
                  {...register("short_name")}
                  className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary text-center placeholder-slate-600 focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Cidade</label>
            <input 
              type="text" 
              placeholder="Ex: João Pessoa" 
              disabled={loading} 
              {...register("city")} 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary placeholder-slate-600 focus:outline-none focus:border-brand-accent" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Responsável</label>
            <input 
              type="text" 
              placeholder="Nome do representante" 
              disabled={loading} 
              {...register("manager")} 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary placeholder-slate-600 focus:outline-none focus:border-brand-accent" 
            />
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
                "Cadastrar Equipe"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
