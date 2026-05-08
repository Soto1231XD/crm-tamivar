import { useEffect, useState } from 'react';
import { useLeadsStore } from '@/modules/leads/store/useLeadsStore';
import { formatDate, getFullImageUrl } from '../utils/formatters';
import { getStatusStyles } from '@/shared/ui/statusStyles';

export const DevelopmentVisitsList = ({
  developmentId,
}: {
  developmentId: number;
}) => {
  const {
    developmentLeads,
    isLoading,
    error,
    fetchLeadsByDevelopment,
    clearDevelopmentLeads,
  } = useLeadsStore();

  useEffect(() => {
    if (developmentId) {
      void fetchLeadsByDevelopment(developmentId);
    }

    return () => {
      clearDevelopmentLeads();
    };
  }, [clearDevelopmentLeads, developmentId, fetchLeadsByDevelopment]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = developmentLeads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(developmentLeads.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [developmentId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <span className="animate-pulse text-sm font-bold uppercase tracking-wider text-slate-500">
          Cargando registros...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="mb-1 text-sm font-bold uppercase tracking-wide">Ocurrio un error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b-2 border-slate-300 pb-4 sm:flex-row sm:items-center">
        <h3 className="text-xl font-bold text-slate-900">Historial de Visitas</h3>
        <p className="text-sm font-medium italic">
          Total de registros:{' '}
          <span className="font-bold not-italic text-slate-900">{developmentLeads.length}</span>
        </p>
      </div>

      {developmentLeads.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
            No hay visitas registradas para este desarrollo.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {currentItems.map((visita) => (
            <div key={visita.id} className="group py-6 first:pt-2 last:pb-2">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                <div className="flex-1 space-y-3">
                  <h4 className="text-lg font-extrabold capitalize tracking-tight text-slate-900">
                    {visita.nombres} {visita.apellidos}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <span>Telefono:</span>
                      <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 text-indigo-700 shadow-sm">
                        {visita.lada} {visita.telefono?.toString() || 'N/A'}
                      </span>
                    </div>

                    <span className="hidden text-slate-300 sm:block">|</span>

                    <div className="flex items-center gap-2">
                      <span>Cita:</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                        {formatDate(visita.fecha_cita || visita.creado_en)}
                      </span>
                    </div>
                  </div>
                </div>

                {visita.creador ? (
                  <div className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-indigo-100 shadow-sm ring-1 ring-slate-200">
                      {visita.creador.foto_url ? (
                        <img
                          src={getFullImageUrl(visita.creador.foto_url)}
                          alt={visita.creador.nombres ?? 'Asesor'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-black uppercase text-indigo-600">
                          {visita.creador.nombres?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <p className="mb-1 text-[9px] font-black uppercase leading-none tracking-widest text-indigo-500">
                        Registrado por
                      </p>
                      <p className="truncate text-sm font-bold capitalize text-slate-800">
                        {visita.creador.nombres} {visita.creador.apellido_paterno}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex min-w-[120px] items-center justify-end">
                  <span
                    className="w-full rounded-full border px-4 py-2 text-center text-[10px] font-black uppercase tracking-widest shadow-sm transition-all sm:w-auto"
                    style={getStatusStyles(visita.estado ?? '')}
                  >
                    {visita.estado}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t-2 border-slate-300 pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Pagina {currentPage} de {totalPages || 1}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
            className={`rounded-lg border p-2.5 transition-all ${
              currentPage === 1
                ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400'
                : 'border-slate-300 bg-white text-indigo-600 shadow-sm hover:border-indigo-400 hover:bg-slate-50 active:scale-95'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 font-bold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0 || isLoading}
            className={`rounded-lg border p-2.5 transition-all ${
              currentPage === totalPages || totalPages === 0
                ? 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400'
                : 'border-slate-300 bg-white text-indigo-600 shadow-sm hover:border-indigo-400 hover:bg-slate-50 active:scale-95'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 font-bold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
