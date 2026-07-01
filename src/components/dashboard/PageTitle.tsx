interface PageTitleProps {
  title: string;
  subtitle?: string;
}

export default function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
      {subtitle && <p className="text-sm text-brand-textSecondary mt-1">{subtitle}</p>}
    </div>
  );
}
