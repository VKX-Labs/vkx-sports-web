interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Section({ title, children, className = "" }: SectionProps) {
  return (
    <section className={className}>
      {title && (
        <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
      )}
      {children}
    </section>
  );
}
