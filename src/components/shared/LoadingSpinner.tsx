import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Carregando..." }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-20">
      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      <span className="text-sm text-slate-400 font-medium">{message}</span>
    </div>
  );
}
