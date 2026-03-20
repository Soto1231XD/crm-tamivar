import React from 'react';
import editarIcon from '@/assets/images/Editar.png';
import borrarIcon from '@/assets/images/Borrar.png';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
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
  customActions?: (item: T) => React.ReactNode;
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
  customActions,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: BaseTableProps<T>) => {
  const hasActions = Boolean(onEdit || onDelete || customActions);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${wrapperClassName}`.trim()}
    >
      <div className="overflow-x-auto">
        <table className={tableClassName}>
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={[
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600',
                    col.headerClassName ?? '',
                  ].join(' ').trim()}
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-6 text-center text-sm text-slate-600">
                  Cargando informacion...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-6 text-center text-sm text-slate-600">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={[
                        'px-4 py-3 text-sm text-slate-700 align-top',
                        col.cellClassName ?? '',
                      ].join(' ').trim()}
                    >
                      {col.render ? col.render(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className={actionsClassName}>
                        {onEdit && canEdit && (
                          <button
                            type="button"
                            title="Editar"
                            className="rounded-md border border-slate-300 p-1.5 text-slate-700 transition-colors hover:bg-slate-100"
                            onClick={() => onEdit(item)}
                          >
                            <img src={editarIcon} alt="Editar" className="h-5 w-5" />
                          </button>
                        )}

                        {customActions && customActions(item)}

                        {onDelete && canDelete && (
                          <button
                            type="button"
                            title="Eliminar"
                            className="rounded-md border border-slate-300 p-1.5 text-slate-700 transition-colors hover:bg-slate-100"
                            onClick={() => onDelete(item)}
                          >
                            <img src={borrarIcon} alt="Eliminar" className="h-5 w-5" />
                          </button>
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
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
          <p className="text-sm text-slate-700">
            Pagina <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
          </p>
          <div className="flex flex-1 justify-end gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
