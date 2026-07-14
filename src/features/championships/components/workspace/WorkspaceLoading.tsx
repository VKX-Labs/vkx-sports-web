import { Loader2 } from "lucide-react";

export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090d16] space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      <p className="text-sm text-slate-400 font-medium">Sincronizando workspace esportivo...</p>
    </div>
  );
}
