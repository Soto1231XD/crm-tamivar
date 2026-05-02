import { useEffect, useState } from "react";
import { useLeadsStore } from "@/modules/leads/store/useLeadsStore";
import { formatDate, getFullImageUrl } from "../utils/formatters";
import { getStatusStyles } from "@/shared/ui/statusStyles";

export const PropertyVisitsList = ({ propertyId }: { propertyId: number }) => {
  const {
    propertyLeads,
    isLoading,
    error,
    fetchLeadsByProperty,
    clearPropertyLeads,
  } = useLeadsStore();

  // Efecto de Carga y Limpieza
  useEffect(() => {
    if (propertyId) {
      fetchLeadsByProperty(propertyId);
    }
    // Función de cleanup: se ejecuta cuando el componente se destruye/desmonta
    return () => {
      clearPropertyLeads();
    };
  }, [propertyId, fetchLeadsByProperty, clearPropertyLeads]);

  // Lógica de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Cálculos de índices
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = propertyLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(propertyLeads.length / itemsPerPage);

  // Resetear a página 1 si cambias de propiedad
  useEffect(() => {
    setCurrentPage(1);
  }, [propertyId]);

  // Manejo del estado de carga
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px] bg-white rounded-2xl shadow-sm border border-slate-200">
        <span className="text-slate-500 font-bold animate-pulse uppercase tracking-wider text-sm">
          Cargando registros...
        </span>
      </div>
    );
  }

  // Manejo de errores
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <p className="font-bold uppercase tracking-wide text-sm mb-1">
          Ocurrió un error
        </p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b-2 border-slate-300">
        <h3 className="text-xl font-bold text-slate-900">
          Historial de Visitas
        </h3>
        <p className="text-sm font-medium italic">
          Total de registros:{" "}
          <span className="text-slate-900 font-bold not-italic">
            {propertyLeads.length}
          </span>
        </p>
      </div>

      {/* Estado Vacío */}
      {propertyLeads.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wide">
            No hay visitas registradas para esta propiedad.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {currentItems.map((visita) => (
            <div key={visita.id} className="py-6 first:pt-2 last:pb-2 group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* BLOQUE IZQUIERDO: Datos del Cliente y Visita */}
                <div className="space-y-3 flex-1">
                  <h4 className="font-extrabold text-slate-900 text-lg capitalize tracking-tight">
                    {visita.nombres} {visita.apellidos}
                  </h4>

                  <div className="flex flex-wrap gap-4 items-center text-[11px] font-bold uppercase tracking-wider">
                    {/* Teléfono resaltado en azul claro */}
                    <div className="flex items-center gap-2">
                      <span>Teléfono:</span>
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">
                        {visita.lada} {visita.telefono?.toString() || "N/A"}
                      </span>
                    </div>

                    <span className="hidden sm:block text-slate-300">|</span>

                    {/* Fecha de Visita */}
                    <div className="flex items-center gap-2">
                      <span>Cita:</span>
                      <span className="text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {formatDate(visita.fecha_cita || visita.creado_en)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BLOQUE CENTRAL: Creador */}
                {visita.creador && (
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm min-w-[220px]">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-indigo-100 border-2 border-white shrink-0 shadow-sm ring-1 ring-slate-200">
                      {visita.creador.foto_url ? (
                        <img
                          src={getFullImageUrl(visita.creador.foto_url)}
                          alt={visita.creador.nombres ?? "Asesor"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-sm font-black text-indigo-600 uppercase">
                          {visita.creador.nombres?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest leading-none mb-1">
                        Registrado por
                      </p>
                      <p className="text-sm font-bold text-slate-800 capitalize truncate">
                        {visita.creador.nombres}{" "}
                        {visita.creador.apellido_paterno}
                      </p>
                    </div>
                  </div>
                )}

                {/* BLOQUE DERECHO: Estado */}
                <div className="flex items-center justify-end min-w-[120px]">
                  <span
                    className="w-full sm:w-auto text-center px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all"
                    style={getStatusStyles(visita.estado ?? "")}
                  >
                    {visita.estado}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginador */}
      <div className="mt-8 pt-6 border-t-2 border-slate-300 flex items-center justify-between">
        <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">
          Página {currentPage} de {totalPages || 1}
        </p>

        <div className="flex gap-2">
          {/* Botón Anterior */}
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
            className={`p-2.5 rounded-lg border transition-all ${
              currentPage === 1
                ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
                : "bg-white text-indigo-600 border-slate-300 hover:bg-slate-50 hover:border-indigo-400 active:scale-95 shadow-sm"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 font-bold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Botón Siguiente */}
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={
              currentPage === totalPages || totalPages === 0 || isLoading
            }
            className={`p-2.5 rounded-lg border transition-all ${
              currentPage === totalPages || totalPages === 0
                ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
                : "bg-white text-indigo-600 border-slate-300 hover:bg-slate-50 hover:border-indigo-400 active:scale-95 shadow-sm"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 font-bold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};