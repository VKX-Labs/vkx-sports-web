import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-slate-800 bg-[#111827]/40 rounded-2xl p-12 text-center max-w-xl mx-auto">
      <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-800">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <h3 className="text-base font-bold text-slate-200">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
