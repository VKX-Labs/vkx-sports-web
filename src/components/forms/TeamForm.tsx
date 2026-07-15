"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Shield, Upload, Loader2 } from "lucide-react";
import { createTeam } from "@/services/teams/team-service";
import { uploadTeamLogo } from "@/lib/storage/upload-team-logo";

const teamSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  initials: z.string().max(3, "Máximo de 3 letras").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().max(2, "Use apenas a sigla do estado").optional().or(z.literal("")),
  manager_name: z.string().optional().or(z.literal("")),
  manager_phone: z.string().optional().or(z.literal("")),
  kit_primary: z.string(),
  kit_secondary: z.string(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      kit_primary: "#22C55E",
      kit_secondary: "#0F172A",
    }
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

  const onSubmitForm = async (data: TeamFormValues) => {
    try {
      setLoading(true);
      let badgeUrl = null;

      if (imageFile) {
        badgeUrl = await uploadTeamLogo(imageFile);
      }

      await createTeam(championshipId, {
        name: data.name,
        initials: data.initials || "",
        city: data.city || "",
        state: data.state || "",
        country: "Brasil",
        manager_name: data.manager_name || "",
        manager_phone: data.manager_phone || "",
        manager_email: "",
        instagram: "",
        description: "",
        primary_kit_color: data.kit_primary,
        secondary_kit_color: data.kit_secondary,
        badge_url: badgeUrl,
      });

      reset();
      setImageFile(null);
      setImagePreview(null);
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Erro ao salvar a equipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-brand-dark border border-slate-850 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-none">
        
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between sticky top-0 bg-brand-dark z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-accent" />
            <h2 className="text-base font-bold text-brand-textPrimary">Nova Equipe</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-brand-textSecondary hover:text-brand-textPrimary rounded-lg hover:bg-slate-800/50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-5 flex-1">
          
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
                <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Nome do Time *</label>
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
                <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Sigla (3 Letras)</label>
                <input 
                  type="text" 
                  maxLength={3} 
                  placeholder="Ex: RMA"
                  disabled={loading}
                  {...register("initials")}
                  className="w-24 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary text-center placeholder-slate-600 focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Cidade</label>
              <input type="text" placeholder="Ex: João Pessoa" disabled={loading} {...register("city")} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">UF</label>
              <input type="text" placeholder="PB" maxLength={2} disabled={loading} {...register("state")} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary text-center focus:outline-none focus:border-brand-accent" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">Responsável</label>
              <input type="text" placeholder="Nome do representante" disabled={loading} {...register("manager_name")} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-accent" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-brand-textSecondary uppercase tracking-wider">WhatsApp de Contato</label>
              <input type="text" placeholder="(83) 99999-9999" disabled={loading} {...register("manager_phone")} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-brand-textPrimary focus:outline-none focus:border-brand-accent" />
            </div>
          </div>

          <div className="bg-slate-900/20 border border-slate-800/80 p-3 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-brand-textSecondary uppercase tracking-wider block">Cores dos Uniformes</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-xs text-brand-textSecondary">Titular</span>
                <input type="color" disabled={loading} {...register("kit_primary")} className="w-7 h-7 rounded bg-transparent cursor-pointer border-0" />
              </div>
              <div className="flex items-center justify-between bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-xs text-brand-textSecondary">Reserva</span>
                <input type="color" disabled={loading} {...register("kit_secondary")} className="w-7 h-7 rounded bg-transparent cursor-pointer border-0" />
              </div>
            </div>
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