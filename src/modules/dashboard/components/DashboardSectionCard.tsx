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
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <ul className="mt-4 space-y-2">
        {hasItems ? (
          children
        ) : (
          <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {emptyMessage}
          </li>
        )}
      </ul>
    </article>
  );
}
