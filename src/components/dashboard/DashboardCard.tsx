interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ children, className = "" }: DashboardCardProps) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-[#111827]/40 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
