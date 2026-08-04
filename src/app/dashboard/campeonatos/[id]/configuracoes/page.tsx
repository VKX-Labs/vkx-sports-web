"use client";

import { useWorkspace } from "@/features/championships/components/workspace/WorkspaceProvider";

export default function ConfiguracoesPage() {
  const { isOwner } = useWorkspace();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-white">Configurações</h2>

      {isOwner ? (
        <p className="text-sm text-slate-400">
          Gerencie as configurações do campeonato.
        </p>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-sm text-slate-400">
            Você está em modo de leitura. Apenas o criador do campeonato pode
            alterar as configurações.
          </p>
        </div>
      )}
    </div>
  );
}
