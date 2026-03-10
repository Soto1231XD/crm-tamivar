type DashboardSummaryCardsProps = {
  titles: readonly string[];
  values: Record<string, string | number>;
  isLoading: boolean;
};

export function DashboardSummaryCards({ titles, values, isLoading }: DashboardSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {titles.map((title) => (
        <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{isLoading ? '...' : values[title]}</p>
        </article>
      ))}
    </div>
  );
}
