import type { ReactNode } from 'react';

type DashboardSectionCardProps = {
  title: string;
  hasItems: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function DashboardSectionCard({
  title,
  hasItems,
  emptyMessage,
  children,
}: DashboardSectionCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.98))] px-5 py-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Actividad
            </p>
            <h3 className="mt-2 text-base font-bold tracking-tight text-slate-950">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {hasItems ? 'Elementos recientes disponibles' : 'Sin actividad para mostrar'}
            </p>
          </div>
        </div>
      </div>

      <ul className="min-w-0 space-y-3 p-5">
        {hasItems ? (
          children
        ) : (
          <li className="rounded-3xl border border-dashed border-slate-300 bg-[linear-gradient(180deg,#F8FAFC,#F1F5F9)] px-5 py-9 text-center text-sm text-slate-600">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-inset ring-slate-200">
              <span className="text-lg text-slate-400">+</span>
            </div>
            <p className="mt-4 font-semibold text-slate-700">Sin información disponible</p>
            <p className="mt-1">{emptyMessage}</p>
          </li>
        )}
      </ul>
    </article>
  );
}
