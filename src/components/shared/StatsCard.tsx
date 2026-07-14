import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
}

export default function StatsCard({ label, value, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#111827]/40 backdrop-blur-sm p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-brand-accent/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-brand-accent" />
      </div>
      <div>
        <p className="text-sm text-brand-textSecondary font-medium">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
