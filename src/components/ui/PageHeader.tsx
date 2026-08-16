interface PageHeaderProps {
  title: string;
  subtitle: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="rounded-2xl bg-orange-600 px-8 py-6 text-white shadow-lg">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-white/80 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
