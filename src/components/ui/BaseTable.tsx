import React from 'react';
import editarIcon from '@/assets/images/Editar.png';
import borrarIcon from '@/assets/images/Borrar.png';

export interface ColumnDef<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  rowSpan?: (item: T, index: number, data: T[]) => number;
}

interface BaseTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  wrapperClassName?: string;
  tableClassName?: string;
  actionsClassName?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canEditItem?: (item: T) => boolean;
  canDeleteItem?: (item: T) => boolean;
  customActions?: (item: T) => React.ReactNode;
  rowClassName?: (item: T) => string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const BaseTable = <T extends { id: number | string }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No se encontraron registros',
  wrapperClassName = '',
  tableClassName = 'min-w-full text-center',
  actionsClassName = 'flex w-max items-center justify-center gap-2 mx-auto',
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  canEditItem,
  canDeleteItem,
  customActions,
  rowClassName,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: BaseTableProps<T>) => {
  const hasActions = Boolean(onEdit || onDelete || customActions);
  const visiblePages = Array.from(
    new Set(
      [1, currentPage - 1, currentPage, currentPage + 1, totalPages].filter(
        (page) => page >= 1 && page <= totalPages,
      ),
    ),
  ).sort((left, right) => left - right);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] text-[var(--crm-text)] shadow-sm ${wrapperClassName}`.trim()}
    >
      <div className="border-b border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-2 text-xs font-medium text-[var(--crm-text-muted)] sm:hidden">
        Desliza horizontalmente para ver todas las columnas.
      </div>

      <div className="overflow-x-auto overscroll-x-contain">
        <table className={tableClassName}>
          <thead className="border-b border-[var(--crm-border)] bg-[var(--crm-muted)]">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={[
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--crm-text-muted)]',
                    col.headerClassName ?? '',
                  ].join(' ').trim()}
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--crm-text-muted)]">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-6 text-center text-sm text-[var(--crm-text-muted)]">
                  Cargando información...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-6 text-center text-sm text-[var(--crm-text-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-[var(--crm-border)] transition-colors hover:bg-[var(--crm-muted)] ${rowClassName?.(item) ?? ""}`.trim()}>
                  {columns.map((col, colIndex) => {
                    if (col.rowSpan) {
                      const span = col.rowSpan(item, rowIndex, data);
                      if (span === 0) return null;
                      return (
                        <td
                          key={colIndex}
                          rowSpan={span > 1 ? span : undefined}
                          className={[
                            'px-4 py-3 text-sm text-[var(--crm-text)] text-center',
                            'bg-[var(--crm-primary-soft)] font-semibold',
                            'border-l border-r border-[var(--crm-primary-border)]',
                            span > 1 ? 'border-t-2 border-b-2 border-[var(--crm-primary-border)]' : 'border-t border-b border-[var(--crm-primary-border)]',
                            col.cellClassName ?? '',
                          ].join(' ').trim()}
                          style={{ verticalAlign: 'middle' }}
                        >
                          {col.render ? col.render(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={colIndex}
                        className={[
                          'px-4 py-3 text-sm text-[var(--crm-text)] align-top',
                          col.cellClassName ?? '',
                        ].join(' ').trim()}
                      >
                        {col.render ? col.render(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                      </td>
                    );
                  })}

                  {hasActions && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className={actionsClassName}>
                        {onEdit && canEdit && (
                          canEditItem == null || canEditItem(item) ? (
                            <button
                              type="button"
                              title="Editar"
                              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]"
                              onClick={() => onEdit(item)}
                            >
                              <img src={editarIcon} alt="Editar" className="h-5 w-5" />
                            </button>
                          ) : null
                        )}

                        {customActions && customActions(item)}

                        {onDelete && canDelete && (
                          canDeleteItem == null || canDeleteItem(item) ? (
                            <button
                              type="button"
                              title="Eliminar"
                              className="rounded-md border border-[var(--crm-border-strong)] p-1.5 text-[var(--crm-text)] transition-colors hover:bg-[var(--crm-muted)]"
                              onClick={() => onDelete(item)}
                            >
                              <img src={borrarIcon} alt="Eliminar" className="h-5 w-5" />
                            </button>
                          ) : null
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-[var(--crm-border)] bg-[var(--crm-muted)] px-4 py-4 sm:flex-row sm:items-center sm:justify-center sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface)] px-4 py-2 text-sm font-semibold text-[var(--crm-text)] shadow-sm transition hover:bg-[var(--crm-surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true">←</span>
              Anterior
            </button>

            <div className="flex items-center gap-2">
              {visiblePages.map((page) => {
                const isActive = page === currentPage;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange?.(page)}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition',
                      isActive
                        ? 'bg-[var(--crm-primary)] text-white shadow-sm'
                        : 'border border-[var(--crm-border-strong)] bg-[var(--crm-surface)] text-[var(--crm-text)] hover:bg-[var(--crm-surface-soft)]',
                    ].join(' ')}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--crm-border-strong)] bg-[var(--crm-surface)] px-4 py-2 text-sm font-semibold text-[var(--crm-text)] shadow-sm transition hover:bg-[var(--crm-surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
