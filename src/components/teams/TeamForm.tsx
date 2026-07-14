"use client";

import React, { useState, useRef } from "react";
import { X, Shield, Upload, Loader2 } from "lucide-react";
import { createTeam } from "@/services/teams/team-service";
import { uploadTeamLogo } from "@/lib/storage/upload-team-logo";

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

 
  const [formData, setFormData] = useState({
    name: "",
    initials: "",
    city: "",
    state: "",
    country: "Brasil",
    manager_name: "",
    manager_phone: "",
    manager_email: "",
    instagram: "",
    description: "",
    primary_kit_color: "#ffffff",
    secondary_kit_color: "#000000",
  });

  if (!isOpen) return null;

 
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("O nome da equipe é obrigatório!");

    try {
      setLoading(true);
      let badgeUrl = null;

     
      if (imageFile) {
        badgeUrl = await uploadTeamLogo(imageFile);
      }

      
      await createTeam(championshipId, {
        name: formData.name,
        initials: formData.initials || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        manager_name: formData.manager_name || null,
        manager_phone: formData.manager_phone || null,
        manager_email: formData.manager_email || null,
        instagram: formData.instagram || null,
        description: formData.description || null,
        primary_kit_color: formData.primary_kit_color || null,
        secondary_kit_color: formData.secondary_kit_color || null,
        badge_url: badgeUrl,
      });

      onSuccess(); 
      onClose(); 
    } catch (error: any) {
      alert(error.message || "Erro ao salvar a equipe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header do Modal */}
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between sticky top-0 bg-[#0f172a] z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-white">Inscrever Nova Equipe</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          
          {/* Seção 1: Escudo e Identidade */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center border-b border-slate-800/40 pb-6">
            <div className="flex flex-col items-center justify-center">
              <label className="text-xs font-semibold text-slate-400 mb-2">Escudo do Clube</label>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-slate-500 group-hover:text-emerald-400 transition">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Enviar</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <div className="md:col-span-3 grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nome da Equipe *</label>
                <input 
                  type="text" required placeholder="Ex: Barcelona F.C."
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Sigla / Abrev.</label>
                <input 
                  type="text" maxLength={3} placeholder="Ex: BAR"
                  value={formData.initials} onChange={e => setFormData({...formData, initials: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white text-center placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Localização */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Cidade</label>
              <input type="text" placeholder="João Pessoa" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Estado</label>
              <input type="text" placeholder="PB" maxLength={2} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">País</label>
              <input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* Seção 3: Responsável e Contatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-800/40 py-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Responsável pela Equipe</label>
              <input type="text" placeholder="Nome do técnico ou presidente" value={formData.manager_name} onChange={e => setFormData({...formData, manager_name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">WhatsApp / Telefone</label>
              <input type="text" placeholder="(83) 99999-9999" value={formData.manager_phone} onChange={e => setFormData({...formData, manager_phone: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">E-mail</label>
              <input type="email" placeholder="contato@clube.com" value={formData.manager_email} onChange={e => setFormData({...formData, manager_email: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">User do Instagram</label>
              <input type="text" placeholder="@barcelona_fc" value={formData.instagram} onChange={e => setFormData({...formData, instagram: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          {/* Seção 4: Cores dos Uniformes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Uniforme Principal</span>
              <input type="color" value={formData.primary_kit_color} onChange={e => setFormData({...formData, primary_kit_color: e.target.value})} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0" />
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Uniforme Reserva</span>
              <input type="color" value={formData.secondary_kit_color} onChange={e => setFormData({...formData, secondary_kit_color: e.target.value})} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0" />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Descrição / Histórico do Clube</label>
            <textarea rows={2} placeholder="Breve resumo sobre a fundação ou conquistas do clube..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-emerald-500" />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5 transition disabled:opacity-50">
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando no Supabase...
                </>
              ) : (
                "Confirmar Inscrição"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}