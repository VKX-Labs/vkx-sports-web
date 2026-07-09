"use client";

import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

import { createChampionshipWithSeason } from "@/services/championships";
import type { CreateChampionshipInput } from "@/services/championships";

interface ChampionshipFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TournamentType = CreateChampionshipInput["tournament_type"];

export default function ChampionshipFormModal({
  isOpen,
  onClose,
  onSuccess,
}: ChampionshipFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    modality: "Futebol de Campo",
    city: "",
    state: "",
    tournament_type: "PONTOS_CORRIDOS" as TournamentType,
    max_teams: "",
    start_date: "",
    end_date: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      await createChampionshipWithSeason({
        ...formData,
        max_teams: formData.max_teams
          ? parseInt(formData.max_teams)
          : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro ao criar o campeonato.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-slate-800 bg-brand-card p-6 shadow-2xl">
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    modality: e.target.value,
                  })
                }
              >
                <option value="Futebol de Campo">Futebol de Campo</option>
                <option value="Futsal">Futsal</option>
                <option value="Fut7">Fut7</option>
                <option value="Basquete">Basquete</option>
                <option value="Vôlei">Vôlei</option>
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_teams: e.target.value,
                  })
                }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    city: e.target.value,
                  })
                }
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
                className="w-full rounded-xl border border-slate-800 bg-brand-dark px-4 py-3 text-center text-sm uppercase text-white placeholder-slate-600 transition focus:border-emerald-500 focus:outline-none"
                value={formData.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    state: e.target.value,
                  })
                }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    start_date: e.target.value,
                  })
                }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    end_date: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-brand-textSecondary">
              Tipo de Disputa *
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { id: "PONTOS_CORRIDOS", title: "Pontos Corridos" },
                { id: "MATA_MATA", title: "Mata-mata" },
                { id: "GRUPOS_MATA_MATA", title: "Grupos + Mata-mata" },
                { id: "COPA", title: "Copa" },
              ].map((format) => (
                <label
                  key={format.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                    formData.tournament_type === format.id
                      ? "border-emerald-500 bg-emerald-500/5 text-white"
                      : "border-slate-800 bg-brand-dark/50 text-brand-textSecondary hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="tournament_type"
                    value={format.id}
                    checked={formData.tournament_type === format.id}
                    onChange={() =>
                      setFormData({
                        ...formData,
                        tournament_type: format.id as TournamentType,
                      })
                    }
                    className="sr-only"
                  />

                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      formData.tournament_type === format.id
                        ? "border-emerald-500"
                        : "border-slate-600"
                    }`}
                  >
                    {formData.tournament_type === format.id && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {format.title}
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