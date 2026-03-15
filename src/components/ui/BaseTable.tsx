import React from 'react';
import editarIcon from '@/assets/images/Editar.png';
import borrarIcon from '@/assets/images/Borrar.png';

export interface ColumnDef<T> {
  header: string; // El título de la columna
  accessorKey?: keyof T; // La llave del objeto (si es texto plano)
  render?: (item: T) => React.ReactNode; // Función por si queremos pintar algo complejo (Select, Badge, Avatar)
}

interface BaseTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  
  // Acciones por defecto
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  
  // Por si queremos agregar botones extra (Ver detalles, Descargar, etc.)
  customActions?: (item: T) => React.ReactNode; 
  
  // Paginación
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

// Usamos un Genérico <T> y le pedimos que al menos tenga un 'id' para el key de React
export const BaseTable = <T extends { id: number | string }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No se encontraron registros',
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
  customActions,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: BaseTableProps<T>) => {
  
  // Verificamos si la tabla debe renderizar la columna de acciones
  const hasActions = Boolean(onEdit || onDelete || customActions);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full text-center"> 
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-6 text-center text-sm text-slate-600">
                  Cargando información...
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
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  
                  {/* Celdas dinámicas */}
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {/* Si hay una función render custom, la usamos. Si no, imprimimos el valor directo */}
                      {col.render ? col.render(item) : col.accessorKey ? String(item[col.accessorKey]) : null}
                    </td>
                  ))}

                  {/* Celda de Acciones */}
                  {hasActions && (
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 w-max mx-auto">
                        
                        {/* Botón Editar */}
                        {onEdit && canEdit && (
                          <button
                            type="button"
                            title="Editar"
                            className="rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
                            onClick={() => onEdit(item)}
                          >
                            <img src={editarIcon} alt="Editar" className="h-5 w-5" />
                          </button>
                        )}
                        
                        {/* Acciones Personalizadas */}
                        {customActions && customActions(item)}

                        {/* Botón Eliminar */}
                        {onDelete && canDelete && (
                          <button
                            type="button"
                            title="Eliminar"
                            className="rounded-md border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100 transition-colors"
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

      {/* Paginador Integrado */}
      {!isLoading && totalPages > 1 && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between sm:px-6">
          <p className="text-sm text-slate-700">
            Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
          </p>
          <div className="flex flex-1 justify-end gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};