"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

import { useCreateChampionship } from "@/hooks/useCreateChampionship";
import { TOURNAMENT_TYPES, MODALITIES } from "@/constants/championships";

interface ChampionshipFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ChampionshipFormModal({
  isOpen,
  onClose,
  onSuccess,
}: ChampionshipFormModalProps) {
  const { create, loading, error } = useCreateChampionship();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    modality: "Futebol de Campo",
    city: "",
    state: "",
    tournament_type: "PONTOS_CORRIDOS" as string,
    max_teams: "",
    start_date: "",
    end_date: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await create({
        ...formData,
        tournament_type: formData.tournament_type as
          | "PONTOS_CORRIDOS"
          | "MATA_MATA"
          | "GRUPOS_MATA_MATA"
          | "COPA",
        max_teams: formData.max_teams
          ? parseInt(formData.max_teams)
          : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });

      onSuccess();
      onClose();
    } catch {
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6">
      <div className="relative my-8 w-full max-w-2xl mx-auto rounded-2xl border border-slate-800 bg-brand-card p-4 sm:p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-textSecondary transition hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold text-white">
            Configurações Gerais do Campeonato
          </h3>
          <p className="mt-1 text-sm text-brand-textSecondary">
            Preencha os dados abaixo para instanciar a competição.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
              Nome do Campeonato *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Liga Paraibana de Futebol"
              className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-sm text-white placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                Modalidade
              </label>
              <select
                className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-sm text-white transition focus:border-emerald-500 focus:outline-none"
                value={formData.modality}
                onChange={(e) => updateField("modality", e.target.value)}
              >
                {MODALITIES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                Nº Máximo de Equipes (Opcional)
              </label>
              <input
                type="number"
                placeholder="Ex: 16"
                className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-sm text-white placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none"
                value={formData.max_teams}
                onChange={(e) => updateField("max_teams", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                Cidade
              </label>
              <input
                type="text"
                placeholder="João Pessoa"
                className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-sm text-white placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                Estado (UF)
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="PB"
                className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-sm text-center uppercase text-white placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none"
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                Data de Início
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-sm text-white transition focus:border-emerald-500 focus:outline-none"
                value={formData.start_date}
                onChange={(e) => updateField("start_date", e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
                Data Final
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-sm text-white transition focus:border-emerald-500 focus:outline-none"
                value={formData.end_date}
                onChange={(e) => updateField("end_date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
              Tipo de Disputa *
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {TOURNAMENT_TYPES.map((format) => (
                <label
                  key={format.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                    formData.tournament_type === format.value
                      ? "border-emerald-500 bg-emerald-500/5 text-white"
                      : "border-slate-800 bg-brand-dark/50 text-brand-textSecondary hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="tournament_type"
                    value={format.value}
                    checked={formData.tournament_type === format.value}
                    onChange={() => updateField("tournament_type", format.value)}
                    className="sr-only"
                  />

                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      formData.tournament_type === format.value
                        ? "border-emerald-500"
                        : "border-slate-600"
                    }`}
                  >
                    {formData.tournament_type === format.value && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {format.label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-brand-textSecondary transition hover:bg-slate-800 hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Campeonato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
