"use client";

import React, { useState } from "react";
import { Trophy, Layers, X } from "lucide-react";

interface NewChampionshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: "unico" | "categorias") => void;
}

export default function NewChampionshipModal({ isOpen, onClose, onSelectType }: NewChampionshipModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-brand-card rounded-2xl border border-slate-800 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-brand-textSecondary hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white">Criar novo campeonato</h3>
          <p className="text-sm text-brand-textSecondary mt-1">
            Selecione a estrutura ideal para a sua competição esportiva.
          </p>
        </div>

        {/* Opções (Inspiradas na image_3732fa.png) */}
        <div className="space-y-4">
          
          {/* Opção 1: Campeonato Único */}
          <button
            onClick={() => onSelectType("unico")}
            className="w-full text-left p-4 rounded-xl border border-slate-800 bg-brand-dark/50 hover:border-emerald-500/40 hover:bg-brand-dark/80 transition group flex items-start gap-4"
          >
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-emerald-400 transition">Campeonato único</h4>
              <p className="text-sm text-brand-textSecondary mt-0.5 leading-relaxed">
                Campeonato de uma única modalidade e divisão com apenas 1 categoria geral.
              </p>
            </div>
          </button>

          {/* Opção 2: Com Categorias */}
          <button
            onClick={() => onSelectType("categorias")}
            className="w-full text-left p-4 rounded-xl border border-slate-800 bg-brand-dark/50 hover:border-emerald-500/40 hover:bg-brand-dark/80 transition group flex items-start gap-4"
          >
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white group-hover:text-emerald-400 transition">Campeonato com categorias</h4>
              <p className="text-sm text-brand-textSecondary mt-0.5 leading-relaxed">
                Perfeito para mais de uma categoria. Ex: divisões por idade, masculino/feminino, ou séries A/B.
              </p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}